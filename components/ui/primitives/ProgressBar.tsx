'use client'

import { forwardRef, useEffect, useRef } from 'react'

export type ProgressBarVariant = 'default' | 'success' | 'warning' | 'danger'
export type ProgressBarSize = 'sm' | 'md' | 'lg'

export interface ProgressBarProps {
  value: number
  label?: string
  showPercentage?: boolean
  variant?: ProgressBarVariant
  animated?: boolean
  size?: ProgressBarSize
  className?: string
  style?: React.CSSProperties
  delayMs?: number
}

const variantColour: Record<ProgressBarVariant, string> = {
  default: 'var(--accent-primary)',
  success: 'var(--accent-success)',
  warning: 'var(--accent-warning)',
  danger:  'var(--accent-danger)',
}

const sizeHeight: Record<ProgressBarSize, number> = { sm: 4, md: 7, lg: 10 }

export const ProgressBar = forwardRef<HTMLDivElement, ProgressBarProps>(
  (
    {
      value,
      label,
      showPercentage = false,
      variant = 'default',
      animated = false,
      size = 'md',
      className = '',
      style,
      delayMs = 0,
    },
    ref
  ) => {
    const clamp = Math.min(100, Math.max(0, value))
    const fillRef = useRef<HTMLDivElement>(null)
    const colour = variantColour[variant]

    // Animate width on mount
    useEffect(() => {
      const el = fillRef.current
      if (!el) return
      el.style.width = '0%'
      const timer = setTimeout(() => {
        const raf = requestAnimationFrame(() => {
          if (fillRef.current) fillRef.current.style.width = `${clamp}%`
        })
      }, delayMs)
      return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
      if (fillRef.current) fillRef.current.style.width = `${clamp}%`
    }, [clamp])

    return (
      <div ref={ref} style={{ display: 'flex', flexDirection: 'column', gap: 5, ...style }} className={className}>
        {(label || showPercentage) && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {label && (
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>
                {label}
              </span>
            )}
            {showPercentage && (
              <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontWeight: 600 }}>
                {clamp}%
              </span>
            )}
          </div>
        )}
        <div
          style={{
            height: sizeHeight[size],
            borderRadius: 'var(--radius-full)',
            background: 'var(--bg-surface-3)',
            overflow: 'hidden',
          }}
        >
          <div
            ref={fillRef}
            style={{
              height: '100%',
              width: `${clamp}%`,
              borderRadius: 'var(--radius-full)',
              background: animated
                ? `linear-gradient(90deg, ${colour}, color-mix(in srgb, ${colour} 70%, white), ${colour})`
                : colour,
              backgroundSize: animated ? '200% 100%' : undefined,
              animation: animated ? 'shimmer 1.8s ease-in-out infinite' : undefined,
              transition: 'width var(--transition-slow)',
            }}
          />
        </div>
      </div>
    )
  }
)
ProgressBar.displayName = 'ProgressBar'
