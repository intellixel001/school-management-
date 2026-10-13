'use client'

import { memo } from 'react'

interface MockSessionTimerProps {
  secondsRemaining: number
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export const MockSessionTimer = memo(function MockSessionTimer({ secondsRemaining }: MockSessionTimerProps) {
  const isLow = secondsRemaining < 300 // less than 5 mins

  return (
    <div 
      className="font-mono font-bold" 
      style={{ 
        fontSize: 25, 
        color: isLow ? 'var(--accent-danger)' : 'var(--text-primary)',
        transition: 'color 0.3s ease'
      }}
    >
      {formatTime(secondsRemaining)}
    </div>
  )
})
