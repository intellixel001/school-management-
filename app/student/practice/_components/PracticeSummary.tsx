'use client'

import { CheckCircle2, XCircle, RotateCcw, LayoutDashboard } from 'lucide-react'
import { SKILL_CONFIG } from '@/lib/skillConfig'
import type { SkillArea, Question } from '@/types/platform'
import Link from 'next/link'

const SKILL_COLOR: Record<SkillArea, { color: string; bar: string }> = {
  reading:   { color: '#6366F1', bar: 'linear-gradient(90deg,#6366F1,#818CF8)' },
  writing:   { color: '#10B981', bar: 'linear-gradient(90deg,#10B981,#34D399)' },
  speaking:  { color: '#F59E0B', bar: 'linear-gradient(90deg,#F59E0B,#FCD34D)' },
  listening: { color: '#EC4899', bar: 'linear-gradient(90deg,#EC4899,#F472B6)' },
}

interface AnswerRecord {
  questionId: string
  questionText: string
  studentAnswer: string
  isCorrect: boolean
}

interface Props {
  skill: SkillArea
  answers: AnswerRecord[]
  questions: Question[]
  onPractiseAgain: () => void
}

// ── Large result ring ─────────────────────────────────────────────────────────
function ResultRing({ pct, color }: { pct: number; color: string }) {
  const r    = 64
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  const ringColor = pct >= 75 ? '#10B981' : pct >= 50 ? '#F59E0B' : '#EF4444'

  return (
    <svg width={160} height={160} viewBox="0 0 160 160" style={{ overflow: 'visible' }}>
      {/* Outer glow track */}
      <circle cx={80} cy={80} r={r} fill="none" stroke="#F1F5F9" strokeWidth={11} />
      {/* Arc */}
      <circle
        cx={80} cy={80} r={r} fill="none"
        stroke={ringColor} strokeWidth={11}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 80 80)"
        style={{ animation: 'ringFill 800ms cubic-bezier(0.4,0,0.2,1) both', filter: `drop-shadow(0 0 6px ${ringColor}60)` }}
      />
      {/* Pct text */}
      <text x={80} y={72} textAnchor="middle" fontSize={34} fontWeight={900}
        fill={ringColor} style={{ fontFamily: 'monospace' }}>
        {pct}%
      </text>
      <text x={80} y={94} textAnchor="middle" fontSize={13}
        fill="#94A3B8" style={{ fontFamily: 'sans-serif' }}>
        Your score
      </text>
    </svg>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function PracticeSummary({ skill, answers, questions, onPractiseAgain }: Props) {
  const cfg          = SKILL_CONFIG[skill]
  const pal          = SKILL_COLOR[skill]
  const Icon         = cfg.icon
  const correctCount = answers.filter(a => a.isCorrect).length
  const total        = answers.length
  const pct          = total > 0 ? Math.round((correctCount / total) * 100) : 0

  const band = pct >= 75
    ? { label: 'Excellent!',   emoji: '🎉', bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.20)',  color: '#15803D' }
    : pct >= 50
    ? { label: 'Good work!',   emoji: '👍', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.20)',  color: '#92400E' }
    : { label: 'Keep trying!', emoji: '💪', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.20)',   color: '#991B1B' }

  return (
    <div style={{ animation: 'questionFadeIn 300ms ease-out both', maxWidth: 680 }}>

      {/* ── Hero result card ── */}
      <div style={{
        background: '#FFFFFF', borderRadius: 20,
        border: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
        padding: '32px 28px', marginBottom: 20,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        textAlign: 'center', gap: 12,
        animation: 'questionFadeIn 300ms ease-out 60ms both',
      }}>
        {/* Skill icon */}
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: `${pal.color}15`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 4,
        }}>
          <Icon size={24} color={pal.color} strokeWidth={2.2} />
        </div>

        <div style={{ fontSize: 14, color: '#94A3B8', fontWeight: 500 }}>
          {cfg.label} Practice Complete
        </div>

        {/* Score ring */}
        <ResultRing pct={pct} color={pal.color} />

        {/* Performance band */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '8px 20px', borderRadius: 30,
          background: band.bg, border: `1.5px solid ${band.border}`,
          color: band.color, fontSize: 15, fontWeight: 700,
        }}>
          <span style={{ fontSize: 18 }}>{band.emoji}</span>
          {band.label}
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 24, marginTop: 8 }}>
          <div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#10B981', fontFamily: 'monospace' }}>
              {correctCount}
            </div>
            <div style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500 }}>Correct</div>
          </div>
          <div style={{ width: 1, background: '#F1F5F9' }} />
          <div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#EF4444', fontFamily: 'monospace' }}>
              {total - correctCount}
            </div>
            <div style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500 }}>Incorrect</div>
          </div>
          <div style={{ width: 1, background: '#F1F5F9' }} />
          <div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#64748B', fontFamily: 'monospace' }}>
              {total}
            </div>
            <div style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500 }}>Total</div>
          </div>
        </div>
      </div>

      {/* ── Review list ── */}
      <div style={{
        background: '#FFFFFF', borderRadius: 16,
        border: '1px solid rgba(0,0,0,0.06)',
        overflow: 'hidden', marginBottom: 20,
        animation: 'questionFadeIn 300ms ease-out 120ms both',
      }}>
        <div style={{
          padding: '14px 20px',
          borderBottom: '1px solid #F1F5F9',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', fontFamily: 'var(--font-display)' }}>
            Answer Review
          </span>
          <span style={{ fontSize: 12, color: '#94A3B8' }}>
            {correctCount}/{total} correct
          </span>
        </div>

        {answers.map((ans, idx) => {
          const correctAnswer = questions.find(q => q.id === ans.questionId)?.correctAnswer
          const isLast = idx === answers.length - 1
          return (
            <div key={ans.questionId} style={{
              display: 'flex', alignItems: 'flex-start', gap: 12,
              padding: '14px 20px',
              borderBottom: isLast ? 'none' : '1px solid #F8FAFC',
            }}>
              {/* Status icon */}
              <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                background: ans.isCorrect ? 'rgba(16,185,129,0.10)' : 'rgba(239,68,68,0.10)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1,
              }}>
                {ans.isCorrect
                  ? <CheckCircle2 size={15} color="#10B981" />
                  : <XCircle size={15} color="#EF4444" />
                }
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Question text */}
                <div style={{
                  fontSize: 13, color: '#334155', lineHeight: 1.5, marginBottom: 5,
                  overflow: 'hidden', display: '-webkit-box',
                  WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                }}>
                  {ans.questionText}
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  {/* Student's answer */}
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6,
                    background: ans.isCorrect ? 'rgba(16,185,129,0.10)' : 'rgba(239,68,68,0.10)',
                    color: ans.isCorrect ? '#15803D' : '#B91C1C',
                  }}>
                    {ans.isCorrect ? '✓' : '✗'} {ans.studentAnswer || '(no answer)'}
                  </span>

                  {/* Correct answer (only if wrong) */}
                  {!ans.isCorrect && correctAnswer && (
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6,
                      background: 'rgba(16,185,129,0.10)', color: '#15803D',
                    }}>
                      ✓ {correctAnswer}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Action buttons + bottom spacer so buttons clear mobile nav ── */}
      <div style={{
        display: 'flex', gap: 12, flexWrap: 'wrap',
        paddingBottom: 32,
        animation: 'questionFadeIn 300ms ease-out 180ms both',
      }}>
        <button
          type="button"
          onClick={onPractiseAgain}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '12px 24px', borderRadius: 12,
            background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
            color: '#FFFFFF', border: 'none',
            fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 700,
            cursor: 'pointer', minHeight: 46,
            boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
            transition: 'opacity 150ms ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.88' }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
        >
          <RotateCcw size={16} /> Practice Again
        </button>

        <Link href="/student" style={{ textDecoration: 'none' }}>
          <button
            type="button"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '12px 24px', borderRadius: 12,
              background: '#FFFFFF', color: '#334155',
              border: '1.5px solid rgba(0,0,0,0.10)',
              fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 600,
              cursor: 'pointer', minHeight: 46,
              transition: 'background 150ms ease, border-color 150ms ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFF'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.30)' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.10)' }}
          >
            <LayoutDashboard size={16} /> Dashboard
          </button>
        </Link>
      </div>
    </div>
  )
}
