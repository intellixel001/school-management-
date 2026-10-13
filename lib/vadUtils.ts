'use client'

// VAD is used ONLY for visual voice-detection feedback.
// All audio transcription is handled by Push-to-Talk (PTT) via speechUtils.

type VADCallbacks = {
  onSpeechStart: () => void
  onSpeechEnd: () => void
  onError: (error: string) => void
}

let vadInstance: {
  start: () => Promise<void>
  pause: () => Promise<void>
  destroy: () => Promise<void>
} | null = null

let isVADRunning = false

export async function startVAD(callbacks: VADCallbacks): Promise<void> {
  if (isVADRunning) return

  try {
    const { MicVAD } = await import('@ricky0123/vad-web')

    vadInstance = await MicVAD.new({
      baseAssetPath: '/',
      onnxWASMBasePath: '/',
      model: 'legacy',
      positiveSpeechThreshold: 0.5,
      negativeSpeechThreshold: 0.5,
      minSpeechMs: 150,
      preSpeechPadMs: 300,
      redemptionMs: 500,

      onSpeechStart: () => {
        callbacks.onSpeechStart()
      },

      onSpeechEnd: () => {
        callbacks.onSpeechEnd()
      },

      onVADMisfire: () => {},
    })

    await vadInstance.start()
    isVADRunning = true
    // Start paused — page must call resumeVAD() explicitly to begin listening
    await vadInstance.pause()
  } catch {
    callbacks.onError(
      'Could not start voice detection. Please allow microphone access.'
    )
  }
}

export function pauseVAD(): void {
  if (vadInstance && isVADRunning) {
    try {
      vadInstance.pause()
    } catch {
      // ignore
    }
  }
}

export function resumeVAD(): void {
  if (vadInstance && isVADRunning) {
    try {
      vadInstance.start()
    } catch {
      // ignore
    }
  }
}

export function stopVAD(): void {
  if (vadInstance) {
    try {
      vadInstance.destroy()
    } catch {
      // ignore
    }
    vadInstance = null
    isVADRunning = false
  }
}

export function isVADSupported(): boolean {
  return typeof window !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia
}
