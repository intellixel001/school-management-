'use client'

import { SKILL_CONFIG } from '@/lib/skillConfig'
import type { SkillArea } from '@/types/platform'

const SKILL_COLOR: Record<SkillArea, string> = {
  reading:   '#6366F1',
  writing:   '#10B981',
  speaking:  '#F59E0B',
  listening: '#EC4899',
}

interface Props {
  skill: SkillArea
  answeredCount: number
  totalQuestions: number
  correctCount: number
  answers?: boolean[]   // true = correct, false = wrong
}

// ── Big SVG score ring ────────────────────────────────────────────────────────
function BigScoreRing({ pct, correct, total, color }: {
  pct: number; correct: number; total: number; color: string
}) {
  const r    = 52
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ

  const ringColor = pct === 0 ? '#E2E8F0' : pct >= 75 ? '#10B981' : pct >= 50 ? '#F59E0B' : '#EF4444'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <svg width={130} height={130} viewBox="0 0 130 130" style={{ overflow: 'visible' }}>
        {/* Track */}
        <circle cx={65} cy={65} r={r} fill="none" stroke="#F1F5F9" strokeWidth={9} />
        {/* Progress arc */}
        <circle
          cx={65} cy={65} r={r} fill="none"
          stroke={ringColor} strokeWidth={9}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 65 65)"
          style={{ transition: 'stroke-dasharray 700ms cubic-bezier(0.4,0,0.2,1), stroke 400ms ease' }}
        />
        {/* Centre text */}
        <text x={65} y={58} textAnchor="middle" fontSize={28} fontWeight={800}
          fill={total === 0 ? '#CBD5E1' : ringColor}
          style={{ fontFamily: 'monospace', transition: 'fill 400ms ease' }}
        >
          {total === 0 ? '—' : `${pct}%`}
        </text>
        <text x={65} y={78} textAnchor="middle" fontSize={12}
          fill="#94A3B8" style={{ fontFamily: 'sans-serif' }}
        >
          {total === 0 ? 'No answers yet' : `${correct} of ${total}`}
        </text>
      </svg>

      {/* Score label */}
      {total > 0 && (
        <div style={{
          padding: '4px 14px', borderRadius: 20,
          background: pct >= 75 ? 'rgba(16,185,129,0.10)' : pct >= 50 ? 'rgba(245,158,11,0.10)' : 'rgba(239,68,68,0.10)',
          color: pct >= 75 ? '#15803D' : pct >= 50 ? '#92400E' : '#991B1B',
          fontSize: 12, fontWeight: 700,
        }}>
          {pct >= 75 ? '🎉 Excellent!' : pct >= 50 ? '👍 Good work' : '💪 Keep going'}
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export function PracticeProgress({ skill, answeredCount, totalQuestions, correctCount, answers = [] }: Props) {
  const cfg   = SKILL_CONFIG[skill]
  const color = SKILL_COLOR[skill]
  const Icon  = cfg.icon
  const pct   = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0

  const wrongCount = answeredCount - correctCount

  return (
    <div style={{
      background: '#FFFFFF', borderRadius: 18,
      border: '1px solid rgba(0,0,0,0.07)',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      padding: '22px 20px',
      display: 'flex', flexDirection: 'column', gap: 20,
      position: 'sticky', top: 20,
    }}>

      {/* ── Skill header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 12, flexShrink: 0,
          background: `${color}15`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={20} color={color} strokeWidth={2.2} />
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', fontFamily: 'var(--font-display)' }}>
            {cfg.label}
          </div>
          <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 1 }}>
            Practice session
          </div>
        </div>
      </div>

      {/* ── Divider ── */}
      <div style={{ height: 1, background: '#F1F5F9' }} />

      {/* ── Score ring ── */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <BigScoreRing pct={pct} correct={correctCount} total={answeredCount} color={color} />
      </div>

      {/* ── Tally row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{
          padding: '10px 12px', borderRadius: 12,
          background: 'rgba(16,185,129,0.07)',
          border: '1px solid rgba(16,185,129,0.15)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#10B981', fontFamily: 'monospace' }}>
            {correctCount}
          </div>
          <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, marginTop: 1 }}>Correct ✓</div>
        </div>
        <div style={{
          padding: '10px 12px', borderRadius: 12,
          background: 'rgba(239,68,68,0.07)',
          border: '1px solid rgba(239,68,68,0.15)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#EF4444', fontFamily: 'monospace' }}>
            {wrongCount}
          </div>
          <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, marginTop: 1 }}>Wrong ✗</div>
        </div>
      </div>

      {/* ── Question dot map ── */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 10 }}>
          Questions
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {Array.from({ length: totalQuestions }).map((_, i) => {
            const isDone    = i < answers.length
            const isCurrent = i === answeredCount
            const wasRight  = isDone ? answers[i] : null

            return (
              <div key={i} style={{
                width: 28, height: 28, borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700,
                background: isCurrent
                  ? `${color}20`
                  : wasRight === true  ? 'rgba(16,185,129,0.12)'
                  : wasRight === false ? 'rgba(239,68,68,0.12)'
                  : '#F8FAFC',
                border: `1.5px solid ${
                  isCurrent ? color
                  : wasRight === true  ? '#86EFAC'
                  : wasRight === false ? '#FECACA'
                  : '#E2E8F0'
                }`,
                color: isCurrent ? color
                  : wasRight === true  ? '#15803D'
                  : wasRight === false ? '#B91C1C'
                  : '#CBD5E1',
                transition: 'all 250ms ease',
              }}>
                {wasRight === true  ? '✓'
                 : wasRight === false ? '✗'
                 : i + 1}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Remaining count ── */}
      <div style={{
        fontSize: 12, color: '#94A3B8', textAlign: 'center',
        fontWeight: 500,
      }}>
        {totalQuestions - answeredCount} question{totalQuestions - answeredCount !== 1 ? 's' : ''} remaining
      </div>
    </div>
  )
}
