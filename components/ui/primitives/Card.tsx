'use client'

import { forwardRef } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

export type CardVariant = 'default' | 'elevated' | 'ghost'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
  hover?: boolean
  active?: boolean
  glowing?: boolean
  children: React.ReactNode
}

// ─── Component ────────────────────────────────────────────────────────────────

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      hover = false,
      active = false,
      glowing = false,
      className = '',
      style,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyle: React.CSSProperties = {
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--border-subtle)',
      transition: `transform var(--transition-base), box-shadow var(--transition-base), border-color var(--transition-base)`,
      position: 'relative',
      ...(variant === 'default' && {
        background: 'var(--bg-surface)',
        boxShadow: 'var(--shadow-card)',
      }),
      ...(variant === 'elevated' && {
        background: 'var(--bg-surface-2)',
        boxShadow: 'var(--shadow-float)',
        borderColor: 'var(--border-default)',
      }),
      ...(variant === 'ghost' && {
        background: 'transparent',
        boxShadow: 'none',
        borderColor: 'var(--border-subtle)',
      }),
      ...(glowing && {
        boxShadow: `var(--shadow-glow), var(--shadow-card)`,
        borderColor: 'var(--border-default)',
        background: 'color-mix(in srgb, var(--accent-primary) 3%, var(--bg-surface))',
      }),
      ...(active && {
        borderLeftWidth: '2px',
        borderLeftColor: 'var(--accent-primary)',
        boxShadow: 'var(--shadow-float)',
      }),
      ...style,
    }

    return (
      <div
        ref={ref}
        style={baseStyle}
        className={[
          hover
            ? 'hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-float)] cursor-pointer'
            : '',
          className,
        ].join(' ')}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'
