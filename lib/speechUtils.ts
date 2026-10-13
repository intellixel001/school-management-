'use client'

// speechUtils.ts — MediaRecorder mic input + Web Speech API TTS output

let currentUtterance: SpeechSynthesisUtterance | null = null
// Incremented on every speakText/stopSpeaking call so stale onend callbacks self-cancel
let utteranceSerial = 0
let mediaRecorder: MediaRecorder | null = null
let audioChunks: Blob[] = []
let volumeAnimationId: number | null = null
let mediaStream: MediaStream | null = null

// ─── RECORDING (MediaRecorder → Groq Whisper) ────────────────────────────────

export function isRecordingSupported(): boolean {
  if (typeof window === 'undefined') return false
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any
  return !!(w.navigator?.mediaDevices?.getUserMedia && w.MediaRecorder)
}

// Keep for backwards-compat check in page.tsx
export function isSpeechSupported(): boolean {
  return isRecordingSupported() && isSpeechSynthesisSupported()
}

export async function startRecording(
  onVolumeChange: (volume: number) => void
): Promise<void> {
  // Cancel any active TTS so the mic isn't blocked
  if (window.speechSynthesis?.speaking) {
    window.speechSynthesis.cancel()
    await new Promise((resolve) => setTimeout(resolve, 150))
  }

  audioChunks = []

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  mediaStream = stream

  // Volume meter via AnalyserNode
  const audioCtx = new AudioContext()
  const source = audioCtx.createMediaStreamSource(stream)
  const analyser = audioCtx.createAnalyser()
  analyser.fftSize = 256
  source.connect(analyser)
  const dataArray = new Uint8Array(analyser.frequencyBinCount)

  const tick = () => {
    analyser.getByteFrequencyData(dataArray)
    const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length
    onVolumeChange(Math.min(100, (avg / 128) * 100))
    volumeAnimationId = requestAnimationFrame(tick)
  }
  tick()

  // Pick supported MIME type
  const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
    ? 'audio/webm;codecs=opus'
    : MediaRecorder.isTypeSupported('audio/webm')
    ? 'audio/webm'
    : 'audio/mp4'

  mediaRecorder = new MediaRecorder(stream, { mimeType })
  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) audioChunks.push(e.data)
  }
  mediaRecorder.start(100) // collect chunks every 100ms
}

export async function stopRecording(): Promise<string> {
  // Stop volume animation
  if (volumeAnimationId !== null) {
    cancelAnimationFrame(volumeAnimationId)
    volumeAnimationId = null
  }

  if (!mediaRecorder) return ''

  return new Promise((resolve) => {
    mediaRecorder!.onstop = async () => {
      // Stop all tracks
      mediaStream?.getTracks().forEach((t) => t.stop())
      mediaStream = null

      const mimeType = mediaRecorder?.mimeType ?? 'audio/webm'
      const blob = new Blob(audioChunks, { type: mimeType })
      audioChunks = []
      mediaRecorder = null

      if (blob.size < 1000) {
        // Too small — probably silence
        resolve('')
        return
      }

      try {
        const ext = mimeType.includes('mp4') ? 'mp4' : 'webm'
        const formData = new FormData()
        formData.append('audio', blob, `recording.${ext}`)

        const res = await fetch('/api/transcribe', {
          method: 'POST',
          body: formData,
        })

        if (!res.ok) {
          resolve('')
          return
        }

        const data = await res.json()
        resolve((data.transcript as string) ?? '')
      } catch {
        resolve('')
      }
    }

    mediaRecorder!.stop()
  })
}

// ─── SPEECH SYNTHESIS (AI Voice Output) ─────────────────────────────────────

export function speakText(
  text: string,
  onStart?: () => void,
  onEnd?: () => void
): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return

  // Clear any pending onvoiceschanged handler from a previous call before cancelling,
  // otherwise the old handler fires after cancel and re-queues the old utterance.
  window.speechSynthesis.onvoiceschanged = null
  window.speechSynthesis.cancel()

  // Capture serial AFTER cancel so the old utterance's onend (triggered by cancel)
  // sees a stale serial and skips its callback.
  const mySerial = ++utteranceSerial

  const utterance = new SpeechSynthesisUtterance(text)
  currentUtterance = utterance

  utterance.rate = 0.92
  utterance.pitch = 1.05
  utterance.volume = 1.0

  utterance.onstart = () => {
    if (mySerial !== utteranceSerial) return
    onStart?.()
  }
  utterance.onend = () => {
    if (mySerial !== utteranceSerial) return
    currentUtterance = null
    onEnd?.()
  }
  utterance.onerror = () => {
    if (mySerial !== utteranceSerial) return
    currentUtterance = null
    onEnd?.()
  }

  const selectVoiceAndSpeak = () => {
    const voices = window.speechSynthesis.getVoices()
    const preferred =
      voices.find(v => v.name.includes('Google UK English Female')) ||
      voices.find(v => v.name.includes('Google UK English Male')) ||
      voices.find(v => v.name.includes('Microsoft Libby')) ||
      voices.find(v => v.name.includes('Microsoft Hazel')) ||
      voices.find(v => v.lang === 'en-GB') ||
      voices.find(v => v.lang.startsWith('en'))
    if (preferred) utterance.voice = preferred
    window.speechSynthesis.speak(utterance)
  }

  const voices = window.speechSynthesis.getVoices()
  if (voices.length > 0) {
    selectVoiceAndSpeak()
  } else {
    // Voices not yet loaded (common on first page load in Chrome/Safari)
    window.speechSynthesis.onvoiceschanged = () => {
      if (mySerial !== utteranceSerial) return  // a newer call already took over
      window.speechSynthesis.onvoiceschanged = null
      selectVoiceAndSpeak()
    }
  }
}

export function stopSpeaking(): void {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    utteranceSerial++  // invalidate any pending onend callback
    window.speechSynthesis.onvoiceschanged = null
    window.speechSynthesis.cancel()
    currentUtterance = null
  }
}

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && !!window.speechSynthesis
}

// ─── PUSH-TO-TALK (PTT) ──────────────────────────────────────────────────────

let pttVolume = 0

export async function startPTTRecording(): Promise<void> {
  pttVolume = 0
  await startRecording((vol) => {
    pttVolume = vol
  })
}

export async function stopPTTRecording(): Promise<string> {
  pttVolume = 0
  return stopRecording()
}

export function getPTTVolume(): number {
  return pttVolume
}
