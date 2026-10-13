'use client'

import type { VoiceState } from '@/types'

interface WaveformProps {
  state: VoiceState
}

const BAR_COUNT = 24

export default function Waveform({ state }: WaveformProps) {
  const isActive = state === 'listening' || state === 'speaking'

  return (
    <div className="flex items-center justify-center gap-[3px] h-10">
      {Array.from({ length: BAR_COUNT }).map((_, i) => {
        const delay = `${(i * 40) % 600}ms`
        const duration = `${600 + (i * 37) % 400}ms`

        return (
          <span
            key={i}
            style={isActive ? { animationDelay: delay, animationDuration: duration } : {}}
            className={`
              block w-[3px] rounded-full transition-all duration-300
              ${state === 'listening'
                ? 'bg-red-400 animate-waveform'
                : state === 'speaking'
                ? 'bg-violet-400 animate-waveform'
                : state === 'thinking'
                ? 'bg-amber-400 h-1 opacity-60'
                : state === 'error'
                ? 'bg-red-700 h-1 opacity-40'
                : 'bg-violet-700 h-1 opacity-40'
              }
            `}
          />
        )
      })}
    </div>
  )
}
