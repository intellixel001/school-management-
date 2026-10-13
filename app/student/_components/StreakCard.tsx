'use client'

import { Flame } from 'lucide-react'
import type { Student, Session } from '@/types/platform'

interface Props {
  student: Student
  sessions: Session[]
}

const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const

/** YYYY-MM-DD in local time. */
function ymd(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// Palette per streak tier. Calm blue while building (< 3 days), warm amber once on fire (≥ 3).
const HOT_PALETTE = {
  cardBackground: 'linear-gradient(145deg, #FFF7ED 0%, #FFFBEB 60%, #FEF3C7 100%)',
  cardBorderTint: 'rgba(251,146,60,0.18)',
  iconColor: '#F97316',
  badgeBg: 'rgba(249,115,22,0.12)',
  badgeText: '#F97316',
  dotEmpty: '#FDE8CC',
  dotFilled: 'linear-gradient(135deg, #F97316 0%, #FB923C 100%)',
  dotFilledShadow: '0 3px 10px rgba(249,115,22,0.35)',
  todayBorder: '#F97316',
  dayLabel: '#92400E',
  footerText: '#92400E',
}

const COOL_PALETTE = {
  cardBackground: 'linear-gradient(145deg, #EFF6FF 0%, #F0F9FF 60%, #DBEAFE 100%)',
  cardBorderTint: 'rgba(59,130,246,0.18)',
  iconColor: '#3B82F6',
  badgeBg: 'rgba(59,130,246,0.12)',
  badgeText: '#3B82F6',
  dotEmpty: '#DBEAFE',
  dotFilled: 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)',
  dotFilledShadow: '0 3px 10px rgba(59,130,246,0.30)',
  todayBorder: '#3B82F6',
  dayLabel: '#1E40AF',
  footerText: '#1E40AF',
}

export function StreakCard({ student, sessions }: Props) {
  // Build a set of YMD dates the student was active on (any completed session).
  const activeDates = new Set<string>()
  for (const s of sessions) {
    if (s.status !== 'completed') continue
    activeDates.add(ymd(new Date(s.date)))
  }

  // Walk the last 7 days, today on the right (index 6).
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dots = Array.from({ length: 7 }, (_, i) => {
    const offset = 6 - i // i=0 => 6 days ago, i=6 => today
    const date = new Date(today.getTime() - offset * 24 * 60 * 60 * 1000)
    const dateKey = ymd(date)
    return {
      letter: DAY_LETTERS[date.getDay()],
      active: activeDates.has(dateKey),
      isToday: offset === 0,
    }
  })

  const isOnFire = student.streak >= 3
  const palette = isOnFire ? HOT_PALETTE : COOL_PALETTE

  const footerMessage = student.streak > 0
    ? 'Good job, keep going!'
    : 'Start a session today!'

  return (
    <div style={{
      background: palette.cardBackground,
      borderRadius: 16,
      padding: '20px 22px',
      boxShadow: `0 1px 3px rgba(0,0,0,0.05), 0 0 0 1px ${palette.cardBorderTint}`,
      transition: 'background 400ms ease, box-shadow 400ms ease',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Flame size={18} color={palette.iconColor} strokeWidth={2.5} />
          <span style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', fontFamily: 'var(--font-display)' }}>
            Daily Streak
          </span>
        </div>
        {isOnFire && (
          <span style={{
            fontSize: 11, fontWeight: 700, color: palette.badgeText,
            background: palette.badgeBg, borderRadius: 6,
            padding: '3px 8px',
          }}>
            On fire!
          </span>
        )}
      </div>

      {/* Big number */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 18 }}>
        <span className="s-streak-num" style={{
          fontSize: 52,
          fontWeight: 900, color: '#0F172A',
          lineHeight: 1, fontFamily: 'var(--font-mono)',
        }}>
          {student.streak}
        </span>
        <span style={{ fontSize: 16, color: '#94A3B8', fontWeight: 500 }}>days</span>
      </div>

      {/* 7-day dots — reflects real session activity */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
        {dots.map((d, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              background: d.active ? palette.dotFilled : palette.dotEmpty,
              border: d.isToday ? `2.5px solid ${palette.todayBorder}` : '2.5px solid transparent',
              boxShadow: d.active ? palette.dotFilledShadow : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 300ms ease',
            }}>
              {d.active && (
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,255,255,0.65)' }} />
              )}
            </div>
            <span style={{ fontSize: 9, color: palette.dayLabel, fontWeight: 700, letterSpacing: '0.3px' }}>
              {d.letter}
            </span>
          </div>
        ))}
      </div>

      <p style={{ fontSize: 12, color: palette.footerText, margin: 0, fontWeight: 600 }}>
        {footerMessage}
      </p>
    </div>
  )
}
