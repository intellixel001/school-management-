'use client'

import { forwardRef } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'
export type BadgeSize = 'sm' | 'md'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  size?: BadgeSize
  dot?: boolean
  children: React.ReactNode
}

// ─── Colour maps ──────────────────────────────────────────────────────────────

const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
  default: {
    background: 'var(--accent-tint)',
    color: 'var(--accent-primary)',
  },
  success: {
    background: 'color-mix(in srgb, var(--accent-success) 12%, transparent)',
    color: 'var(--accent-success)',
  },
  warning: {
    background: 'color-mix(in srgb, var(--accent-warning) 12%, transparent)',
    color: 'var(--accent-warning)',
  },
  danger: {
    background: 'color-mix(in srgb, var(--accent-danger) 10%, transparent)',
    color: 'var(--accent-danger)',
  },
  info: {
    background: 'color-mix(in srgb, var(--accent-primary) 10%, transparent)',
    color: 'var(--accent-primary)',
  },
  neutral: {
    background: 'color-mix(in srgb, var(--accent-neutral) 10%, transparent)',
    color: 'var(--accent-neutral)',
  },
}

const sizeStyles: Record<BadgeSize, React.CSSProperties> = {
  sm: { fontSize: '10px', padding: '1px 7px' },
  md: { fontSize: '11px', padding: '2px 9px' },
}

// ─── Component ────────────────────────────────────────────────────────────────

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      variant = 'default',
      size = 'md',
      dot = false,
      className = '',
      style,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <span
        ref={ref}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          borderRadius: 'var(--radius-full)',
          fontFamily: 'var(--font-mono)',
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          lineHeight: 1,
          ...variantStyles[variant],
          ...sizeStyles[size],
          ...style,
        }}
        className={className}
        {...props}
      >
        {dot && (
          <span
            aria-hidden="true"
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'currentColor',
              display: 'inline-block',
              animation: 'dotPulse 1.4s ease-in-out infinite',
            }}
          />
        )}
        {children}
      </span>
    )
  }
)

Badge.displayName = 'Badge'
