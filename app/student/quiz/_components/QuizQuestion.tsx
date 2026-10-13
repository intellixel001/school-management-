'use client'

import { useEffect, useRef, useState } from 'react'
import type { Question } from '@/types/platform'

const QUESTION_TIME = 20
const LETTERS = ['A', 'B', 'C', 'D', 'E']

interface Props {
  question:        Question
  questionNumber:  number
  totalQuestions:  number
  score:           number
  onAnswer:        (answer: string | null, timeRemaining: number) => void
  isRevealing:     boolean
  submittedAnswer: string | null
  correctAnswer:   string
}

// ── Circular countdown timer ──────────────────────────────────────────────────
function CircularTimer({ timeLeft, totalTime = 20 }: { timeLeft: number; totalTime?: number }) {
  const r     = 42
  const circ  = 2 * Math.PI * r
  const pct   = timeLeft / totalTime
  const dash  = pct * circ

  const ringColor = pct > 0.5 ? '#10B981' : pct > 0.25 ? '#F59E0B' : '#EF4444'
  const isUrgent  = timeLeft <= 5 && timeLeft > 0

  return (
    <div style={{ position:'relative', width:100, height:100, flexShrink:0 }}>
      <svg width={100} height={100} viewBox="0 0 100 100" style={{ overflow:'visible' }}>
        {/* Soft bg circle */}
        <circle cx={50} cy={50} r={r} fill={`${ringColor}08`} />
        {/* Track */}
        <circle cx={50} cy={50} r={r} fill="none" stroke="#F1F5F9" strokeWidth={7} />
        {/* Countdown arc */}
        <circle
          cx={50} cy={50} r={r} fill="none"
          stroke={ringColor} strokeWidth={7}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
          style={{
            transition:'stroke-dasharray 1s linear, stroke 350ms ease',
            filter: isUrgent ? `drop-shadow(0 0 5px ${ringColor}90)` : 'none',
          }}
        />
      </svg>
      {/* Seconds label */}
      <div style={{
        position:'absolute', inset:0,
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        gap:0,
      }}>
        <span style={{
          fontFamily:'monospace', fontSize:26, fontWeight:900,
          color: ringColor, lineHeight:1,
          animation: isUrgent ? 'timerPulse 500ms ease-in-out infinite' : 'none',
          transition:'color 350ms ease',
        }}>
          {timeLeft}
        </span>
        <span style={{ fontSize:9, color:'#94A3B8', fontWeight:600, letterSpacing:'0.5px', textTransform:'uppercase' }}>
          sec
        </span>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export function QuizQuestion({
  question, questionNumber, totalQuestions,
  score, onAnswer, isRevealing, submittedAnswer, correctAnswer,
}: Props) {
  const [timeLeft,   setTimeLeft]   = useState(QUESTION_TIME)
  const [scoreBump,  setScoreBump]  = useState(false)
  const answeredRef                 = useRef(false)
  const prevScoreRef                = useRef(score)

  // Reset per question (component remounts via key, but keep this for safety)
  useEffect(() => {
    setTimeLeft(QUESTION_TIME)
    answeredRef.current = false
  }, [question.id])

  // Countdown
  useEffect(() => {
    if (isRevealing) return
    const id = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(id)
          if (!answeredRef.current) {
            answeredRef.current = true
            onAnswer(null, 0)
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [question.id, isRevealing, onAnswer])

  // Score pop animation
  useEffect(() => {
    if (score !== prevScoreRef.current) {
      prevScoreRef.current = score
      setScoreBump(true)
      const t1 = setTimeout(() => setScoreBump(false), 400)
      return () => { clearTimeout(t1) }
    }
  }, [score])

  function handleOption(opt: string) {
    if (answeredRef.current || isRevealing) return
    answeredRef.current = true
    onAnswer(opt, timeLeft)
  }

  const options = question.options ?? []
  const isTimeout = isRevealing && submittedAnswer === null

  return (
    <div style={{ maxWidth:620, margin:'0 auto', animation:'questionFadeIn 250ms ease-out both' }}>

      {/* ── Top bar: dots + score ── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
        {/* Progress dots */}
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          {Array.from({ length: totalQuestions }).map((_, i) => (
            <div key={i} style={{
              width: i === questionNumber - 1 ? 22 : 8, height:8,
              borderRadius:99, transition:'all 250ms ease',
              background: i < questionNumber - 1
                ? '#6366F1'
                : i === questionNumber - 1
                ? 'linear-gradient(90deg,#6366F1,#818CF8)'
                : '#E2E8F0',
              boxShadow: i === questionNumber - 1 ? '0 0 0 3px rgba(99,102,241,0.18)' : 'none',
            }} />
          ))}
          <span style={{ fontSize:12, color:'#94A3B8', fontWeight:600, marginLeft:4 }}>
            {questionNumber}/{totalQuestions}
          </span>
        </div>

        {/* Live score */}
        <div style={{ position:'relative' }}>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ fontSize:11, fontWeight:600, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'0.5px' }}>Score</span>
            <span
              key={score}
              style={{
                fontFamily:'monospace', fontSize:20, fontWeight:900, color:'#0F172A',
                display:'inline-block',
                animation: scoreBump ? 'scorePop 400ms ease-out both' : 'none',
              }}
            >
              {score}
            </span>
          </div>
        </div>
      </div>

      {/* ── Timer + question card ── */}
      <div style={{
        background:'#FFFFFF', borderRadius:20,
        border:'1px solid rgba(0,0,0,0.07)',
        boxShadow:'0 2px 12px rgba(0,0,0,0.06)',
        padding:'22px 24px', marginBottom:16,
      }}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:20 }}>
          {/* Timer */}
          <CircularTimer timeLeft={timeLeft} totalTime={QUESTION_TIME} />

          {/* Question text */}
          <div style={{ flex:1, minWidth:0, paddingTop:6 }}>
            <div style={{
              display:'inline-flex', alignItems:'center', gap:5,
              background:'rgba(99,102,241,0.08)', color:'#6366F1',
              borderRadius:8, padding:'3px 10px', marginBottom:10,
              fontSize:10, fontWeight:700, letterSpacing:'0.5px', textTransform:'uppercase',
            }}>
              {question.type === 'true-false' ? 'True or False' : 'Multiple Choice'}
            </div>
            <p style={{
              fontFamily:'var(--font-body)', fontSize:16, fontWeight:500,
              color:'#0F172A', lineHeight:1.65, margin:0,
            }}>
              {question.questionText}
            </p>
          </div>
        </div>
      </div>

      {/* ── Answer options ── */}
      <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:16 }}>
        {options.map((opt, idx) => {
          const isSubmitted = submittedAnswer === opt
          const isCorrectOpt = opt === correctAnswer

          let bg          = '#FFFFFF'
          let border      = 'rgba(0,0,0,0.09)'
          let color       = '#0F172A'
          let letterBg    = '#F1F5F9'
          let letterColor = '#64748B'
          let icon        = ''

          if (isRevealing) {
            if (isCorrectOpt) {
              bg = '#F0FDF4'; border = '#86EFAC'; color = '#15803D'
              letterBg = '#22C55E'; letterColor = '#FFFFFF'; icon = '✓'
            } else if (isSubmitted) {
              bg = '#FEF2F2'; border = '#FECACA'; color = '#B91C1C'
              letterBg = '#EF4444'; letterColor = '#FFFFFF'; icon = '✗'
            } else {
              bg = '#FAFAFA'; color = '#CBD5E1'; border = '#F1F5F9'
              letterBg = '#F1F5F9'; letterColor = '#CBD5E1'
            }
          }

          const letter = LETTERS[idx] ?? String(idx + 1)

          return (
            <button
              key={opt} type="button"
              disabled={isRevealing || answeredRef.current}
              onClick={() => handleOption(opt)}
              className="quiz-option-btn"
              style={{
                width:'100%', padding:'13px 16px',
                textAlign:'left', borderRadius:14,
                border:`1.5px solid ${border}`, background:bg, color,
                fontFamily:'var(--font-body)', fontSize:14, fontWeight:500,
                cursor: isRevealing ? 'default' : 'pointer', outline:'none',
                display:'flex', alignItems:'center', gap:12,
                transition:'all 160ms ease',
                animation: `optionReveal 200ms ease-out ${idx * 50}ms both`,
                boxShadow: isRevealing && isCorrectOpt ? '0 2px 10px rgba(34,197,94,0.20)' : 'none',
              }}
              onMouseEnter={e => {
                if (!isRevealing && !answeredRef.current) {
                  e.currentTarget.style.background = '#F8FAFF'
                  e.currentTarget.style.borderColor = 'rgba(99,102,241,0.30)'
                  e.currentTarget.style.transform = 'translateX(2px)'
                }
              }}
              onMouseLeave={e => {
                if (!isRevealing && !answeredRef.current) {
                  e.currentTarget.style.background = '#FFFFFF'
                  e.currentTarget.style.borderColor = 'rgba(0,0,0,0.09)'
                  e.currentTarget.style.transform = 'translateX(0)'
                }
              }}
            >
              {/* Letter circle */}
              <div style={{
                width:30, height:30, borderRadius:9, flexShrink:0,
                background:letterBg, color:letterColor,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:12, fontWeight:800, transition:'all 160ms ease',
              }}>
                {icon || letter}
              </div>
              <span style={{ flex:1 }}>{opt}</span>
            </button>
          )
        })}
      </div>

      {/* ── Feedback banner ── */}
      {isRevealing && (
        <div style={{
          display:'flex', alignItems:'center', gap:12,
          padding:'13px 18px', borderRadius:14,
          background: isTimeout
            ? 'rgba(245,158,11,0.08)'
            : submittedAnswer === correctAnswer
            ? '#F0FDF4' : '#FEF2F2',
          border:`1.5px solid ${
            isTimeout ? 'rgba(245,158,11,0.25)'
            : submittedAnswer === correctAnswer ? '#86EFAC' : '#FECACA'
          }`,
          animation:'feedbackSlideIn 250ms ease-out both',
        }}>
          <span style={{ fontSize:22 }}>
            {isTimeout ? '⏱️' : submittedAnswer === correctAnswer ? '✨' : '💡'}
          </span>
          <div>
            <div style={{
              fontSize:14, fontWeight:700,
              color: isTimeout ? '#92400E'
                : submittedAnswer === correctAnswer ? '#15803D' : '#B91C1C',
            }}>
              {isTimeout
                ? "Time's up! Moving on…"
                : submittedAnswer === correctAnswer
                ? 'Correct! Well done.'
                : 'Not quite — see the correct answer above.'}
            </div>
            {submittedAnswer === correctAnswer && !isTimeout && (
              <div style={{ fontSize:12, color:'#64748B', marginTop:1 }}>
                +{1} pt
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
