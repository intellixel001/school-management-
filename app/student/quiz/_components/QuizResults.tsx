'use client'

import { RotateCcw, LayoutDashboard } from 'lucide-react'
import Link from 'next/link'
import PointsEarnedBadge from '@/app/_components/PointsEarnedBadge'

const MAX_SCORE = 5   // 1 point per correct answer, 5 questions max

interface QuizAnswerRecord {
  questionText: string
  isCorrect:    boolean
  pointsEarned: number
}

interface Props {
  score:       number
  answers:     QuizAnswerRecord[]
  /** Points awarded this session — null if service call failed or still pending. */
  pointsAwarded: number | null
  /** Running total after this award — null if service call failed. */
  updatedTotalPoints: number | null
  onPlayAgain: () => void
}

// ── Star rating ───────────────────────────────────────────────────────────────
function StarRating({ score }: { score: number }) {
  const pct   = score / MAX_SCORE
  const stars = score === 0 ? 0 : pct >= 0.75 ? 3 : pct >= 0.40 ? 2 : 1
  return (
    <div style={{ display:'flex', gap:10, justifyContent:'center', marginBottom:8 }}>
      {[1,2,3].map(s => (
        <span key={s} style={{
          fontSize:38, lineHeight:1,
          filter: s <= stars ? 'drop-shadow(0 3px 6px rgba(245,158,11,0.45))' : 'grayscale(1) opacity(0.3)',
          animation: s <= stars ? `starDrop 420ms cubic-bezier(0.34,1.56,0.64,1) ${(s-1)*120}ms both` : 'none',
          display:'inline-block',
        }}>
          ⭐
        </span>
      ))}
    </div>
  )
}

// ── Score SVG ring ────────────────────────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const pct   = Math.round((score / MAX_SCORE) * 100)
  const r     = 58
  const circ  = 2 * Math.PI * r
  const dash  = (pct / 100) * circ
  const color = pct >= 75 ? '#10B981' : pct >= 40 ? '#F59E0B' : '#EF4444'

  return (
    <div style={{ position:'relative', width:150, height:150, margin:'0 auto' }}>
      <svg width={150} height={150} viewBox="0 0 150 150" style={{ overflow:'visible' }}>
        <circle cx={75} cy={75} r={r} fill="none" stroke="#F1F5F9" strokeWidth={9} />
        <circle
          cx={75} cy={75} r={r} fill="none"
          stroke={color} strokeWidth={9}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 75 75)"
          style={{
            animation:'ringFill 900ms cubic-bezier(0.4,0,0.2,1) both',
            filter:`drop-shadow(0 0 8px ${color}60)`,
          }}
        />
      </svg>
      <div style={{
        position:'absolute', inset:0,
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      }}>
        <span style={{ fontFamily:'monospace', fontSize:36, fontWeight:900, color, lineHeight:1 }}>
          {score}
        </span>
        <span style={{ fontSize:12, color:'#94A3B8', fontWeight:600 }}>/ {MAX_SCORE}</span>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function QuizResults({ score, answers, pointsAwarded, updatedTotalPoints, onPlayAgain }: Props) {
  const correctCount = answers.filter(a => a.isCorrect).length
  const pct          = Math.round((score / MAX_SCORE) * 100)

  const band = pct >= 75
    ? { label:'Excellent! 🎉',  bg:'rgba(16,185,129,0.08)',  border:'rgba(16,185,129,0.22)', color:'#15803D' }
    : pct >= 40
    ? { label:'Good effort! 👍', bg:'rgba(245,158,11,0.08)', border:'rgba(245,158,11,0.22)', color:'#92400E' }
    : { label:'Keep going! 💪',  bg:'rgba(239,68,68,0.08)',  border:'rgba(239,68,68,0.22)',  color:'#991B1B' }

  return (
    <div style={{ maxWidth:580, margin:'0 auto', animation:'questionFadeIn 300ms ease-out both' }}>

      {/* ── Score hero card ── */}
      <div style={{
        background:'#FFFFFF', borderRadius:20,
        border:'1px solid rgba(0,0,0,0.07)',
        boxShadow:'0 4px 24px rgba(0,0,0,0.06)',
        padding:'32px 24px', marginBottom:20, textAlign:'center',
        animation:'questionFadeIn 300ms ease-out 40ms both',
      }}>
        <StarRating score={score} />

        {/* Points earned badge — shown when service call succeeded */}
        {pointsAwarded !== null && updatedTotalPoints !== null && (
          <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'center' }}>
            <PointsEarnedBadge
              pointsAwarded={pointsAwarded}
              totalPoints={updatedTotalPoints}
              variant="full"
              showTotal={false}
            />
          </div>
        )}

        <ScoreRing score={score} />

        <div style={{
          display:'inline-flex', alignItems:'center', gap:6,
          padding:'7px 18px', borderRadius:24,
          background:band.bg, border:`1.5px solid ${band.border}`,
          color:band.color, fontSize:14, fontWeight:700,
          marginTop:14, marginBottom:10,
        }}>
          {band.label}
        </div>

        <div style={{ fontSize:14, color:'#94A3B8', fontWeight:500 }}>
          {correctCount}/{answers.length} correct
        </div>

        {/* Stat row */}
        <div style={{
          display:'flex', justifyContent:'center', gap:0,
          marginTop:20, borderTop:'1px solid #F1F5F9', paddingTop:18,
        }}>
          {[
            { label:'Correct',    value:String(correctCount),              color:'#10B981' },
            { label:'Wrong',      value:String(answers.length - correctCount), color:'#EF4444' },
            { label:'Total pts',  value:String(score),                     color:'#6366F1' },
          ].map((s, i) => (
            <div key={s.label} style={{
              flex:1, textAlign:'center',
              borderRight: i < 2 ? '1px solid #F1F5F9' : 'none',
            }}>
              <div style={{ fontFamily:'monospace', fontSize:24, fontWeight:800, color:s.color }}>
                {s.value}
              </div>
              <div style={{ fontSize:11, color:'#94A3B8', fontWeight:600, marginTop:2 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Breakdown list ── */}
      <div style={{
        background:'#FFFFFF', borderRadius:16,
        border:'1px solid rgba(0,0,0,0.07)',
        overflow:'hidden', marginBottom:20,
        animation:'questionFadeIn 300ms ease-out 100ms both',
      }}>
        <div style={{
          padding:'13px 20px',
          borderBottom:'1px solid #F1F5F9',
          display:'flex', alignItems:'center', justifyContent:'space-between',
        }}>
          <span style={{ fontSize:15, fontWeight:700, color:'#0F172A', fontFamily:'var(--font-display)' }}>
            Question Breakdown
          </span>
          <span style={{ fontSize:12, color:'#94A3B8' }}>
            {correctCount}/{answers.length} correct
          </span>
        </div>

        {answers.map((ans, idx) => (
          <div key={idx} style={{
            display:'flex', alignItems:'center', gap:12,
            padding:'12px 20px',
            borderBottom: idx < answers.length - 1 ? '1px solid #F8FAFC' : 'none',
          }}>
            {/* Status dot */}
            <div style={{
              width:26, height:26, borderRadius:'50%', flexShrink:0,
              background: ans.isCorrect ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:12, fontWeight:800,
              color: ans.isCorrect ? '#10B981' : '#EF4444',
            }}>
              {ans.isCorrect ? '✓' : '✗'}
            </div>

            {/* Question text */}
            <div style={{
              flex:1, fontSize:13, color:'#334155', overflow:'hidden',
              textOverflow:'ellipsis', whiteSpace:'nowrap',
            }}>
              {ans.questionText}
            </div>

            {/* Points badge */}
            <div style={{
              fontSize:12, fontWeight:800, flexShrink:0,
              padding:'3px 10px', borderRadius:8,
              background: ans.pointsEarned > 0
                ? ans.pointsEarned > 10 ? 'rgba(245,158,11,0.10)' : 'rgba(16,185,129,0.10)'
                : 'rgba(239,68,68,0.08)',
              color: ans.pointsEarned > 0
                ? ans.pointsEarned > 10 ? '#F59E0B' : '#10B981'
                : '#EF4444',
              fontFamily:'monospace',
            }}>
              {ans.pointsEarned > 0
                ? ans.pointsEarned > 10 ? `+${ans.pointsEarned} ⚡` : `+${ans.pointsEarned}`
                : '0'}
            </div>
          </div>
        ))}
      </div>

      {/* ── Actions ── */}
      <div style={{
        display:'flex', gap:12, flexWrap:'wrap', paddingBottom:32,
        animation:'questionFadeIn 300ms ease-out 160ms both',
      }}>
        <button
          type="button" onClick={onPlayAgain}
          style={{
            display:'inline-flex', alignItems:'center', gap:8,
            padding:'12px 24px', borderRadius:12,
            background:'linear-gradient(135deg, #F59E0B 0%, #F97316 100%)',
            color:'#FFFFFF', border:'none',
            fontFamily:'var(--font-body)', fontSize:15, fontWeight:700,
            cursor:'pointer', minHeight:46,
            boxShadow:'0 4px 14px rgba(249,115,22,0.35)',
            transition:'opacity 150ms ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.88' }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
        >
          <RotateCcw size={16} /> Play Again
        </button>

        <Link href="/student" style={{ textDecoration:'none' }}>
          <button
            type="button"
            style={{
              display:'inline-flex', alignItems:'center', gap:8,
              padding:'12px 24px', borderRadius:12,
              background:'#FFFFFF', color:'#334155',
              border:'1.5px solid rgba(0,0,0,0.10)',
              fontFamily:'var(--font-body)', fontSize:15, fontWeight:600,
              cursor:'pointer', minHeight:46,
              transition:'background 150ms ease, border-color 150ms ease',
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
