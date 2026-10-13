'use client'

import { forwardRef } from 'react'

export type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl'

export interface SpinnerProps {
  size?: SpinnerSize
  color?: string
  className?: string
  /**
   * Style applied to the outer wrapper (e.g. margin). Do NOT pass a
   * `transform` here — the rotation animation lives on the SVG and any
   * outer transform would conflict, producing the "jumpy" spinner. Use a
   * larger `size` (`xl` = 80px) instead of scaling.
   */
  style?: React.CSSProperties
  label?: string
}

const sizeMap:   Record<SpinnerSize, number> = { sm: 16, md: 24, lg: 56, xl: 80 }
const strokeMap: Record<SpinnerSize, number> = { sm: 2,  md: 2.5, lg: 4,  xl: 5 }

/**
 * Two-piece spinner: a static wrapper (for consumer margins, gaps, etc.) and
 * an inner rotating SVG. Splitting them means an outer `transform` from a
 * consumer never fights the rotation animation.
 */
export const Spinner = forwardRef<HTMLDivElement, SpinnerProps>(
  ({ size = 'md', color, className = '', style, label = 'Loading…' }, ref) => {
    const px = sizeMap[size]
    const stroke = strokeMap[size]
    const r = (px / 2) - stroke

    return (
      <div
        ref={ref}
        role="status"
        aria-label={label}
        className={className}
        style={{
          display: 'inline-flex',
          flexShrink: 0,
          width: px,
          height: px,
          ...style,
        }}
      >
        <svg
          width={px}
          height={px}
          viewBox={`0 0 ${px} ${px}`}
          fill="none"
          style={{
            width: '100%',
            height: '100%',
            animation: 'ec-spinner-spin 1s linear infinite',
            transformOrigin: '50% 50%',
          }}
          aria-hidden
        >
          <style>{`
            @keyframes ec-spinner-spin { to { transform: rotate(360deg); } }
          `}</style>
          {/* Static track */}
          <circle
            cx={px / 2}
            cy={px / 2}
            r={r}
            stroke={color ?? 'var(--border-default)'}
            strokeOpacity={0.25}
            strokeWidth={stroke}
          />
          {/* Rotating arc — 3/4 circumference for a clear progress cue. */}
          <circle
            cx={px / 2}
            cy={px / 2}
            r={r}
            stroke={color ?? 'var(--accent-primary)'}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${Math.PI * 2 * r * 0.75} ${Math.PI * 2 * r}`}
            transform={`rotate(-90 ${px / 2} ${px / 2})`}
          />
        </svg>
      </div>
    )
  }
)
Spinner.displayName = 'Spinner'
