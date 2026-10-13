/**
 * @file lib/realtime-qwen/audio.ts
 * @description PCM16 encode / decode helpers + a streaming playback queue.
 *
 * Qwen-Omni-Realtime sends and receives audio as base64-encoded little-endian
 * 16-bit PCM at 16 kHz mono. Browsers don't natively work with that format —
 * we convert at the boundaries:
 *
 *   mic Float32 (-1..1)    → downsample → Int16 → base64 (for upload)
 *   base64 → Int16         → Float32 (-1..1) → AudioBuffer → play
 *
 * The PlaybackQueue handles the streaming case: deltas arrive piecemeal, must
 * play in arrival order, and must not click or gap. We schedule each chunk to
 * start exactly when the previous one ends.
 */

const TARGET_SAMPLE_RATE = 16_000

// ─── Encode ───────────────────────────────────────────────────────────────────

/** Downsample Float32 audio to 16 kHz mono if needed, then convert to Int16. */
export function floatTo16BitPCM(input: Float32Array, inputSampleRate: number): Int16Array {
  const downsampled =
    inputSampleRate === TARGET_SAMPLE_RATE ? input : downsampleBuffer(input, inputSampleRate, TARGET_SAMPLE_RATE)

  const out = new Int16Array(downsampled.length)
  for (let i = 0; i < downsampled.length; i++) {
    const s = Math.max(-1, Math.min(1, downsampled[i]))
    // Asymmetric clamp matches typical PCM16 behaviour
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff
  }
  return out
}

function downsampleBuffer(buffer: Float32Array, fromRate: number, toRate: number): Float32Array {
  if (toRate >= fromRate) return buffer
  const ratio = fromRate / toRate
  const newLen = Math.round(buffer.length / ratio)
  const result = new Float32Array(newLen)
  let offsetResult = 0
  let offsetBuffer = 0
  while (offsetResult < newLen) {
    const nextOffset = Math.round((offsetResult + 1) * ratio)
    let acc = 0
    let count = 0
    for (let i = offsetBuffer; i < nextOffset && i < buffer.length; i++) {
      acc += buffer[i]
      count++
    }
    result[offsetResult] = count > 0 ? acc / count : 0
    offsetResult++
    offsetBuffer = nextOffset
  }
  return result
}

/** Encode an Int16Array (little-endian PCM16) as base64. */
export function int16ToBase64(int16: Int16Array): string {
  const bytes = new Uint8Array(int16.buffer, int16.byteOffset, int16.byteLength)
  let binary = ''
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize)
    binary += String.fromCharCode.apply(null, Array.from(chunk))
  }
  return btoa(binary)
}

// ─── Decode ───────────────────────────────────────────────────────────────────

/** Decode base64 PCM16 into a Float32Array in the -1..1 range. */
export function base64PCM16ToFloat32(b64: string): Float32Array {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  const int16 = new Int16Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 2)
  const float = new Float32Array(int16.length)
  for (let i = 0; i < int16.length; i++) {
    float[i] = int16[i] / (int16[i] < 0 ? 0x8000 : 0x7fff)
  }
  return float
}

// ─── Streaming playback queue ────────────────────────────────────────────────

/**
 * Schedules incoming PCM chunks to play back-to-back with no gaps. Each call
 * to `enqueue` starts the chunk at (or just after) the previous chunk's end.
 *
 * Call `stop()` to drop everything currently queued — used when the user
 * interrupts the AI or when we tear down the session.
 */
export class PlaybackQueue {
  private audioContext: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private analyserData: Uint8Array | null = null
  private nextStartTime = 0
  private activeSources: AudioBufferSourceNode[] = []
  private sampleRate: number

  constructor(sampleRate = TARGET_SAMPLE_RATE) {
    this.sampleRate = sampleRate
  }

  /**
   * Update the playback sample rate. Called when the server tells us
   * (via session.created) what output format it'll actually use. If the
   * context was already created at a different rate, recreate it.
   */
  setSampleRate(rate: number): void {
    if (rate === this.sampleRate) return
    this.sampleRate = rate
    if (this.audioContext && this.audioContext.sampleRate !== rate) {
      this.stop()
      void this.audioContext.close().catch(() => {})
      this.audioContext = null
      this.analyser = null
      this.analyserData = null
      this.nextStartTime = 0
    }
  }

  private getContext(): AudioContext {
    if (!this.audioContext || this.audioContext.state === 'closed') {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      this.audioContext = new Ctor({ sampleRate: this.sampleRate })
      this.nextStartTime = 0
      // Insert an analyser between sources and destination so callers (orb
      // visualizer, VU meters, etc.) can read the assistant's audio level.
      this.analyser = this.audioContext.createAnalyser()
      this.analyser.fftSize = 256
      this.analyser.connect(this.audioContext.destination)
      this.analyserData = new Uint8Array(this.analyser.frequencyBinCount)
    }
    if (this.audioContext.state === 'suspended') {
      void this.audioContext.resume()
    }
    return this.audioContext
  }

  enqueue(pcm: Float32Array): void {
    if (pcm.length === 0) return
    const ctx = this.getContext()
    const buffer = ctx.createBuffer(1, pcm.length, this.sampleRate)
    // Copy into the buffer's own channel data directly to avoid ArrayBuffer
    // variance complaints from copyToChannel's strict signature.
    const channel = buffer.getChannelData(0)
    channel.set(pcm)

    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.connect(this.analyser ?? ctx.destination)

    const now = ctx.currentTime
    const startAt = Math.max(now, this.nextStartTime)
    source.start(startAt)
    this.nextStartTime = startAt + buffer.duration

    this.activeSources.push(source)
    source.onended = () => {
      this.activeSources = this.activeSources.filter((s) => s !== source)
    }
  }

  /**
   * Sample the assistant audio level in the 0..1 range. Returns 0 when nothing
   * is playing. Used by the voice orb to drive amplitude-reactive visuals.
   */
  getAmplitude(): number {
    if (!this.analyser || !this.analyserData) return 0
    this.analyser.getByteTimeDomainData(this.analyserData as unknown as Uint8Array<ArrayBuffer>)
    let sumSquares = 0
    for (let i = 0; i < this.analyserData.length; i++) {
      const n = (this.analyserData[i] - 128) / 128
      sumSquares += n * n
    }
    return Math.sqrt(sumSquares / this.analyserData.length)
  }

  /** Cancel anything queued or playing — used when the user interrupts. */
  stop(): void {
    for (const s of this.activeSources) {
      try {
        s.stop()
      } catch {
        // already stopped
      }
    }
    this.activeSources = []
    if (this.audioContext) {
      this.nextStartTime = this.audioContext.currentTime
    }
  }

  async dispose(): Promise<void> {
    this.stop()
    if (this.audioContext) {
      await this.audioContext.close().catch(() => {})
      this.audioContext = null
    }
  }
}
