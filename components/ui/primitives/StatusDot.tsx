'use client'

import { forwardRef } from 'react'

export type StatusDotState = 'active' | 'idle' | 'offline'

export interface StatusDotProps {
  state: StatusDotState
  label?: string
  showLabel?: boolean
  className?: string
  style?: React.CSSProperties
}

const dotColour: Record<StatusDotState, string> = {
  active:  'var(--accent-success)',
  idle:    'var(--accent-warning)',
  offline: 'var(--accent-neutral)',
}

const dotLabel: Record<StatusDotState, string> = {
  active:  'Active',
  idle:    'Idle',
  offline: 'Offline',
}

export const StatusDot = forwardRef<HTMLSpanElement, StatusDotProps>(
  ({ state, label, showLabel = false, className = '', style }, ref) => {
    const colour = dotColour[state]
    const text = label ?? dotLabel[state]

    return (
      <span
        ref={ref}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, ...style }}
        className={className}
        title={text}
        aria-label={text}
      >
        <span
          aria-hidden="true"
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: colour,
            display: 'inline-block',
            flexShrink: 0,
            animation: state === 'active' ? 'dotPulse 1.4s ease-in-out infinite' : 'none',
          }}
        />
        {showLabel && (
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
            {text}
          </span>
        )}
      </span>
    )
  }
)
StatusDot.displayName = 'StatusDot'
