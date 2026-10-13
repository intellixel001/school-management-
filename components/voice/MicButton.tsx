'use client'

import { Mic, MicOff, Square } from 'lucide-react'
import type { VoiceState } from '@/types'

interface MicButtonProps {
  state: VoiceState
  onToggle: () => void
  disabled?: boolean
}

export default function MicButton({ state, onToggle, disabled }: MicButtonProps) {
  const isListening = state === 'listening'
  const isThinking = state === 'thinking'
  const isSpeaking = state === 'speaking'
  const isError = state === 'error'

  return (
    <div className="relative flex items-center justify-center">
      {/* Outer pulse rings — only when listening */}
      {isListening && (
        <>
          <span className="absolute inline-flex h-32 w-32 rounded-full bg-violet-500 opacity-20 animate-ping" />
          <span className="absolute inline-flex h-24 w-24 rounded-full bg-violet-400 opacity-25 animate-ping [animation-delay:150ms]" />
        </>
      )}

      <button
        onClick={onToggle}
        disabled={disabled || isThinking}
        aria-label={isListening ? 'Stop recording' : 'Start recording'}
        className={`
          relative z-10 flex items-center justify-center w-20 h-20 rounded-full
          transition-all duration-300 select-none
          ${isListening
            ? 'bg-red-500 hover:bg-red-600 shadow-[0_0_40px_rgba(239,68,68,0.6)] scale-110'
            : isThinking
            ? 'bg-amber-500 cursor-not-allowed shadow-[0_0_30px_rgba(245,158,11,0.5)] scale-105'
            : isSpeaking
            ? 'bg-violet-600 hover:bg-violet-500 shadow-[0_0_30px_rgba(124,58,237,0.6)] scale-105 cursor-pointer'
            : isError
            ? 'bg-red-700 shadow-[0_0_20px_rgba(185,28,28,0.4)] cursor-pointer'
            : 'bg-violet-600 hover:bg-violet-500 hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(124,58,237,0.4)] cursor-pointer'
          }
          ${disabled ? 'opacity-40 cursor-not-allowed' : ''}
        `}
      >
        {isListening ? (
          <Square className="w-7 h-7 text-white fill-white" />
        ) : isThinking ? (
          <span className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-white animate-bounce"
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))}
          </span>
        ) : isSpeaking ? (
          <MicOff className="w-7 h-7 text-white" />
        ) : (
          <Mic className="w-7 h-7 text-white" />
        )}
      </button>

      <span
        className={`
          absolute -bottom-8 text-xs font-medium tracking-widest uppercase
          ${isListening ? 'text-red-400'
            : isThinking ? 'text-amber-400'
            : isSpeaking ? 'text-violet-300'
            : isError ? 'text-red-400'
            : 'text-violet-400'}
        `}
      >
        {isListening ? 'Listening…'
          : isThinking ? 'Thinking…'
          : isSpeaking ? 'Tap to interrupt'
          : isError ? 'Error — tap to retry'
          : 'Tap to speak'}
      </span>
    </div>
  )
}
