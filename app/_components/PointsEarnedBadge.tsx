'use client'

import { useEffect, useState } from 'react'
import { Star } from 'lucide-react'

interface PointsEarnedBadgeProps {
  pointsAwarded: number       // practice: 0–25; quiz: 0–5
  totalPoints: number         // running total after this award
  /** 'compact' for inline use; 'full' for session-end celebration */
  variant?: 'compact' | 'full'
  /** 'light' or 'dark' theme support */
  theme?: 'light' | 'dark'
  /** Show the "Total: X points" line under the award (full variant only). Default true. */
  showTotal?: boolean
}

export default function PointsEarnedBadge({
  pointsAwarded,
  totalPoints,
  variant = 'full',
  theme = 'light',
  showTotal = true,
}: PointsEarnedBadgeProps) {
  // 200ms opacity-fade entrance — single transition, no springs or particles
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(id)
  }, [])

  if (variant === 'compact') {
    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 12px',
          borderRadius: 99,
          background: theme === 'dark' ? 'rgba(232, 185, 108, 0.1)' : 'rgba(245, 158, 11, 0.12)',
          border: theme === 'dark' ? '1px solid rgba(232, 185, 108, 0.3)' : '1px solid rgba(245, 158, 11, 0.25)',
          opacity: visible ? 1 : 0,
          transition: 'opacity 200ms ease',
        }}
      >
        <Star size={14} style={{ color: theme === 'dark' ? '#E8B96C' : '#D97706', flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: theme === 'dark' ? '#FDE68A' : '#92400E', fontFamily: 'monospace' }}>
          +{pointsAwarded}
        </span>
      </div>
    )
  }

  return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
          padding: '32px 48px',
          borderRadius: 24,
          background: theme === 'dark' ? 'rgba(232, 185, 108, 0.05)' : 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
          border: theme === 'dark' ? '1px solid rgba(232, 185, 108, 0.2)' : '1.5px solid rgba(245, 158, 11, 0.30)',
          boxShadow: theme === 'dark' ? '0 8px 32px rgba(232, 185, 108, 0.15), inset 0 2px 10px rgba(255,255,255,0.05)' : '0 4px 20px rgba(245, 158, 11, 0.12)',
          opacity: visible ? 1 : 0,
          transition: 'opacity 200ms ease',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontFamily: 'monospace',
            fontSize: 14,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            color: theme === 'dark' ? '#E8B96C' : '#B45309',
            fontWeight: 700,
          }}
        >
          Points Earned
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '8px 0' }}>
          <span
            style={{
              fontFamily: 'var(--font-display, sans-serif)',
              fontSize: 72,
              fontWeight: 800,
              color: theme === 'dark' ? '#FDE68A' : '#B45309',
              lineHeight: 1,
              textShadow: theme === 'dark' ? '0 0 30px rgba(232, 185, 108, 0.4)' : 'none',
            }}
          >
            +{pointsAwarded}
          </span>
          <span style={{ fontSize: 24, color: theme === 'dark' ? '#E8B96C' : '#D97706', fontWeight: 600 }}>pts</span>
        </div>

        {showTotal && (
          <div style={{ fontSize: 16, color: theme === 'dark' ? 'var(--text-secondary)' : '#78350F', fontWeight: 500 }}>
            Total:{' '}
            <span style={{ fontWeight: 800, fontFamily: 'monospace', color: theme === 'dark' ? 'var(--text-primary)' : 'inherit' }}>{totalPoints}</span> points
          </div>
        )}
      </div>
  )
}
