'use client'

import Link from 'next/link'
import { Check } from 'lucide-react'

interface Props {
  sessionsToday: number          // pre-computed in page.tsx
  goalSessions?: number          // default 1
}

export function TodaysGoalCard({ sessionsToday, goalSessions = 1 }: Props) {
  const met = sessionsToday >= goalSessions
  const ratio = Math.min(1, sessionsToday / goalSessions)
  const percent = Math.round(ratio * 100)

  // Ring math
  const size = 70
  const strokeWidth = 7
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - ratio)

  return (
    <div className="todays-goal-card" style={{
      background: '#FFFFFF',
      borderRadius: 16,
      padding: '22px 22px',
      boxShadow: '0 1px 3px rgba(15,23,42,0.04), 0 0 0 1px rgba(99,102,241,0.10)',
      transition: 'box-shadow 200ms ease, transform 200ms ease',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 18,
      }}>
        <h2 style={{
          margin: 0, fontSize: 15, fontWeight: 700, color: '#0F172A',
          fontFamily: 'var(--font-display)',
        }}>
          Today's Goal
        </h2>
        {met && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: 11, fontWeight: 700, color: '#10B981',
            background: 'rgba(16,185,129,0.10)', borderRadius: 6,
            padding: '3px 8px',
          }}>
            <Check size={12} strokeWidth={3} />
            Done
          </span>
        )}
      </div>

      {/* Ring + label row */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16,
      }}>
        <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
          <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
            <circle
              cx={size / 2} cy={size / 2} r={radius}
              stroke="#F1F5F9" strokeWidth={strokeWidth} fill="none"
            />
            <circle
              cx={size / 2} cy={size / 2} r={radius}
              stroke={met ? '#10B981' : '#6366F1'}
              strokeWidth={strokeWidth} fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: 'stroke-dashoffset 600ms ease' }}
            />
          </svg>
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 800, color: '#0F172A',
            fontFamily: 'var(--font-mono)',
          }}>
            {sessionsToday}/{goalSessions}
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13, fontWeight: 600, color: '#0F172A',
          }}>
            {goalSessions} practice{goalSessions === 1 ? '' : 's'} today
          </div>
          <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 3 }}>
            {met ? 'Goal complete' : `${percent}% of today's target`}
          </div>
        </div>
      </div>

      {/* CTA / footer */}
      {met ? (
        <p style={{
          margin: 0, fontSize: 12, color: '#64748B', fontWeight: 500,
        }}>
          Great work — see you tomorrow.
        </p>
      ) : (
        <Link href="/student/practice" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontSize: 13, fontWeight: 700, color: '#6366F1',
          textDecoration: 'none',
        }}>
          Start a practice →
        </Link>
      )}
    </div>
  )
}
