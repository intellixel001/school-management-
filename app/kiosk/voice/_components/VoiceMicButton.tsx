'use client'

/**
 * @file app/kiosk/voice/_components/VoiceMicButton.tsx
 * @description Big round mic button that drives the AI voice tutor's PTT flow.
 * Colour, icon and label shift per phase so a passing student can read the
 * current state at a glance from across the kiosk.
 */

import { Mic, Square, Loader2, Volume2 } from 'lucide-react'

export type MicPhase =
  | 'idle'            // press to speak
  | 'recording'       // actively capturing audio
  | 'transcribing'    // waiting on Whisper STT
  | 'thinking'        // waiting on Groq reply
  | 'speaking'        // AI TTS is playing

interface VoiceMicButtonProps {
  phase: MicPhase
  onPress: () => void
  disabled?: boolean
  /** Optional timer text shown under the button while recording. */
  recordingSeconds?: number
}

const PHASE_STYLE: Record<MicPhase, { bg: string; ring: string; label: string }> = {
  idle:         { bg: '#34D399', ring: 'rgba(52, 211, 153, 0.30)', label: 'Tap or hold the spacebar to speak' },
  recording:    { bg: '#DC2626', ring: 'rgba(220, 38, 38, 0.40)',  label: 'Tap to stop' },
  transcribing: { bg: '#8B5CF6', ring: 'rgba(139, 92, 246, 0.35)', label: 'Transcribing…' },
  thinking:     { bg: '#F59E0B', ring: 'rgba(245, 158, 11, 0.35)', label: 'Tutor is thinking…' },
  speaking:     { bg: '#3B82F6', ring: 'rgba(59, 130, 246, 0.35)', label: 'Tutor is speaking…' },
}

function formatSecs(s: number): string {
  const m = Math.floor(s / 60)
  const sec = (s % 60).toString().padStart(2, '0')
  return `${m}:${sec}`
}

export default function VoiceMicButton({ phase, onPress, disabled, recordingSeconds = 0 }: VoiceMicButtonProps) {
  const style = PHASE_STYLE[phase]
  const isBusy = phase === 'transcribing' || phase === 'thinking' || phase === 'speaking'
  const isRecording = phase === 'recording'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
      <button
        onClick={onPress}
        disabled={disabled || isBusy}
        aria-label={style.label}
        style={{
          width: 160, height: 160, borderRadius: '50%',
          border: 'none',
          background: style.bg,
          color: '#FFFFFF',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: (disabled || isBusy) ? 'not-allowed' : 'pointer',
          boxShadow: `0 12px 40px ${style.ring}, 0 0 0 8px ${style.ring}, inset 0 2px 0 rgba(255, 255, 255, 0.18)`,
          transition: 'background 240ms ease, box-shadow 240ms ease, transform 100ms ease',
          outline: 'none',
          animation: isRecording ? 'voice-mic-pulse 1.4s ease-in-out infinite' : undefined,
        }}
        onPointerDown={(e) => { if (!disabled && !isBusy) e.currentTarget.style.transform = 'scale(0.94)' }}
        onPointerUp={(e)   => { e.currentTarget.style.transform = 'scale(1)' }}
        onPointerLeave={(e)=> { e.currentTarget.style.transform = 'scale(1)' }}
        onPointerCancel={(e)=>{ e.currentTarget.style.transform = 'scale(1)' }}
      >
        {phase === 'idle' && <Mic size={64} strokeWidth={2.2} />}
        {phase === 'recording' && <Square size={52} strokeWidth={2.4} fill="#FFFFFF" />}
        {phase === 'transcribing' && <Loader2 size={56} strokeWidth={2.4} style={{ animation: 'voice-mic-spin 1s linear infinite' }} />}
        {phase === 'thinking' && <Loader2 size={56} strokeWidth={2.4} style={{ animation: 'voice-mic-spin 1.4s linear infinite' }} />}
        {phase === 'speaking' && <Volume2 size={64} strokeWidth={2.2} />}
      </button>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <div
          className="font-display"
          style={{
            fontSize: 22,
            fontWeight: 600,
            color: style.bg,
            letterSpacing: '0.01em',
          }}
        >
          {style.label}
        </div>
        {isRecording && (
          <div className="font-mono" style={{ fontSize: 18, color: '#94A3B8' }}>
            {formatSecs(recordingSeconds)}
          </div>
        )}
      </div>

      <style>{`
        @keyframes voice-mic-pulse {
          0%, 100% { box-shadow: 0 12px 40px ${style.ring}, 0 0 0 8px ${style.ring}, inset 0 2px 0 rgba(255, 255, 255, 0.18); }
          50%      { box-shadow: 0 12px 40px ${style.ring}, 0 0 0 20px transparent, inset 0 2px 0 rgba(255, 255, 255, 0.18); }
        }
        @keyframes voice-mic-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
