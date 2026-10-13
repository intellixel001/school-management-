'use client'

import { forwardRef } from 'react'

export interface DividerProps {
  orientation?: 'horizontal' | 'vertical'
  label?: string
  className?: string
  style?: React.CSSProperties
}

export const Divider = forwardRef<HTMLDivElement, DividerProps>(
  ({ orientation = 'horizontal', label, className = '', style }, ref) => {
    if (orientation === 'vertical') {
      return (
        <div
          ref={ref}
          style={{
            width: 1,
            alignSelf: 'stretch',
            background: 'var(--border-subtle)',
            flexShrink: 0,
            ...style,
          }}
          className={className}
          role="separator"
          aria-orientation="vertical"
        />
      )
    }

    if (label) {
      return (
        <div
          ref={ref}
          style={{ display: 'flex', alignItems: 'center', gap: 12, ...style }}
          className={className}
          role="separator"
          aria-orientation="horizontal"
        >
          <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>
            {label}
          </span>
          <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
        </div>
      )
    }

    return (
      <div
        ref={ref}
        style={{ height: 1, background: 'var(--border-subtle)', ...style }}
        className={className}
        role="separator"
        aria-orientation="horizontal"
      />
    )
  }
)
Divider.displayName = 'Divider'
