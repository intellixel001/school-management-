'use client'

import { useState } from 'react'
import { Mic, CheckCircle2, XCircle } from 'lucide-react'
import type { Question } from '@/types/platform'

// ── Question type badge config ────────────────────────────────────────────────
const TYPE_CFG = {
  'mcq':        { label: 'Multiple Choice', color: '#6366F1', bg: 'rgba(99,102,241,0.09)'  },
  'fill-blank': { label: 'Fill in the Blank', color: '#0891B2', bg: 'rgba(8,145,178,0.09)'  },
  'true-false': { label: 'True or False',   color: '#F59E0B', bg: 'rgba(245,158,11,0.09)' },
  'spoken':     { label: 'Speaking',        color: '#EC4899', bg: 'rgba(236,72,153,0.09)'  },
} as const

const LETTERS = ['A', 'B', 'C', 'D', 'E']

// ── Props ─────────────────────────────────────────────────────────────────────
interface QuestionCardProps {
  question: Question
  questionNumber: number
  totalQuestions: number
  answeredHistory?: boolean[]        // correct/wrong for each previous answer
  onSubmit: (answer: string) => void
  showFeedback: boolean
  submittedAnswer: string
  isCorrect: boolean
  onNext: () => void
  isLastQuestion: boolean
}

export function QuestionCard({
  question, questionNumber, totalQuestions,
  answeredHistory = [],
  onSubmit, showFeedback, submittedAnswer, isCorrect,
  onNext, isLastQuestion,
}: QuestionCardProps) {
  const [selected,  setSelected]  = useState<string>('')
  const [fillValue, setFillValue] = useState<string>('')

  const hasAnswer  = question.type === 'fill-blank' ? fillValue.trim().length > 0 : selected.length > 0
  const canSubmit  = hasAnswer && !showFeedback
  const pct        = Math.round((questionNumber / totalQuestions) * 100)
  const typeCfg    = TYPE_CFG[question.type] ?? TYPE_CFG['mcq']

  function handleSubmit() {
    if (!canSubmit) return
    onSubmit(question.type === 'fill-blank' ? fillValue.trim() : selected)
  }

  function handleNext() {
    setSelected('')
    setFillValue('')
    onNext()
  }

  return (
    <div style={{ animation: 'questionFadeIn 280ms ease-out both' }}>

      {/* ── Progress strip ── */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#64748B' }}>
            Question {questionNumber} <span style={{ color: '#CBD5E1' }}>/ {totalQuestions}</span>
          </span>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#6366F1', fontFamily: 'monospace' }}>
            {pct}%
          </span>
        </div>

        {/* Dot progress */}
        <div style={{ display: 'flex', gap: 5, marginBottom: 10, flexWrap: 'wrap' }}>
          {Array.from({ length: totalQuestions }).map((_, i) => {
            const isDone    = i < answeredHistory.length
            const isCurrent = i === questionNumber - 1
            const wasRight  = isDone ? answeredHistory[i] : null

            return (
              <div key={i} style={{
                width: isCurrent ? 24 : 8, height: 8,
                borderRadius: 99,
                background: isCurrent
                  ? '#6366F1'
                  : wasRight === true
                  ? '#10B981'
                  : wasRight === false
                  ? '#EF4444'
                  : '#E2E8F0',
                transition: 'all 250ms ease',
                boxShadow: isCurrent ? '0 0 0 3px rgba(99,102,241,0.20)' : 'none',
              }} />
            )
          })}
        </div>

        {/* Track bar */}
        <div style={{ height: 4, borderRadius: 99, background: '#F1F5F9', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 99, width: `${pct}%`,
            background: 'linear-gradient(90deg, #6366F1, #818CF8)',
            transition: 'width 400ms cubic-bezier(0.4,0,0.2,1)',
          }} />
        </div>
      </div>

      {/* ── Question card ── */}
      <div style={{
        background: '#FFFFFF', borderRadius: 16,
        border: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        padding: '20px 22px', marginBottom: 18,
      }}>
        {/* Type badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          background: typeCfg.bg, color: typeCfg.color,
          borderRadius: 8, padding: '4px 10px',
          fontSize: 11, fontWeight: 700, letterSpacing: '0.3px',
          textTransform: 'uppercase', marginBottom: 14,
        }}>
          {typeCfg.label}
        </div>

        <p style={{
          fontFamily: 'var(--font-body)', fontSize: 17, fontWeight: 500,
          color: '#0F172A', lineHeight: 1.65, margin: 0,
        }}>
          {question.questionText}
        </p>
      </div>

      {/* ── Answer area ── */}
      <div style={{ marginBottom: 18 }}>
        {question.type === 'mcq' && question.options && (
          <MCQOptions
            options={question.options}
            selected={selected}
            onSelect={setSelected}
            disabled={showFeedback}
            showFeedback={showFeedback}
            correctAnswer={question.correctAnswer}
          />
        )}
        {question.type === 'true-false' && (
          <TrueFalseButtons
            selected={selected}
            onSelect={setSelected}
            disabled={showFeedback}
            showFeedback={showFeedback}
            correctAnswer={question.correctAnswer}
          />
        )}
        {question.type === 'fill-blank' && (
          <FillBlankInput
            value={fillValue}
            onChange={setFillValue}
            disabled={showFeedback}
            showFeedback={showFeedback}
            isCorrect={showFeedback
              ? fillValue.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim()
              : false}
            correctAnswer={question.correctAnswer}
          />
        )}
        {question.type === 'spoken' && <SpokenPlaceholder />}
      </div>

      {/* ── Vocabulary hint ── */}
      {question.vocabulary.length > 0 && !showFeedback && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          marginBottom: 18, padding: '8px 12px',
          background: 'rgba(99,102,241,0.05)', borderRadius: 8,
          border: '1px solid rgba(99,102,241,0.10)',
        }}>
          <span style={{ fontSize: 14 }}>📚</span>
          <span style={{ fontSize: 12, color: '#64748B' }}>
            Key words: <strong style={{ color: '#4F46E5' }}>{question.vocabulary.slice(0, 4).join(' · ')}</strong>
          </span>
        </div>
      )}

      {/* ── Feedback banner ── */}
      {showFeedback && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 14,
          padding: '16px 18px', borderRadius: 14, marginBottom: 18,
          background: isCorrect ? '#F0FDF4' : '#FEF2F2',
          border: `1.5px solid ${isCorrect ? '#86EFAC' : '#FECACA'}`,
          animation: 'feedbackSlideIn 280ms ease-out both',
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
            background: isCorrect ? '#22C55E' : '#EF4444',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {isCorrect
              ? <CheckCircle2 size={20} color="#FFFFFF" />
              : <XCircle size={20} color="#FFFFFF" />
            }
          </div>
          <div>
            <div style={{
              fontSize: 15, fontWeight: 700,
              color: isCorrect ? '#15803D' : '#B91C1C',
              marginBottom: isCorrect ? 0 : 4,
            }}>
              {isCorrect ? '✨ Correct! Great work.' : 'Not quite — keep going!'}
            </div>
            {!isCorrect && (
              <div style={{ fontSize: 13, color: '#64748B' }}>
                Correct answer:{' '}
                <span style={{
                  fontWeight: 700, color: '#15803D',
                  background: 'rgba(21,128,61,0.10)',
                  padding: '1px 6px', borderRadius: 5,
                }}>
                  {question.correctAnswer}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Action buttons ── */}
      {!showFeedback ? (
        <button
          type="button"
          disabled={!canSubmit || question.type === 'spoken'}
          onClick={handleSubmit}
          style={{
            padding: '12px 28px', borderRadius: 12,
            background: canSubmit && question.type !== 'spoken'
              ? 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)'
              : '#F1F5F9',
            color: canSubmit && question.type !== 'spoken' ? '#FFFFFF' : '#94A3B8',
            fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 700,
            border: 'none', cursor: canSubmit && question.type !== 'spoken' ? 'pointer' : 'default',
            boxShadow: canSubmit && question.type !== 'spoken'
              ? '0 4px 14px rgba(99,102,241,0.35)'
              : 'none',
            transition: 'all 200ms ease',
            minHeight: 46,
          }}
        >
          Submit Answer
        </button>
      ) : (
        <button
          type="button"
          onClick={handleNext}
          style={{
            padding: '12px 28px', borderRadius: 12,
            background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
            color: '#FFFFFF',
            fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 700,
            border: 'none', cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
            animation: 'feedbackSlideIn 200ms ease-out 120ms both',
            minHeight: 46,
          }}
        >
          {isLastQuestion ? 'See Results →' : 'Next Question →'}
        </button>
      )}
    </div>
  )
}

// ── MCQ ───────────────────────────────────────────────────────────────────────
function MCQOptions({ options, selected, onSelect, disabled, showFeedback, correctAnswer }: {
  options: string[]; selected: string; onSelect: (v: string) => void;
  disabled: boolean; showFeedback: boolean; correctAnswer: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {options.map((opt, idx) => {
        const isSelected = selected === opt
        const isCorrect  = opt === correctAnswer
        const letter     = LETTERS[idx] ?? String(idx + 1)

        let bg     = '#FFFFFF'
        let border = 'rgba(0,0,0,0.09)'
        let color  = '#0F172A'
        let letterBg    = '#F1F5F9'
        let letterColor = '#64748B'

        if (showFeedback) {
          if (isCorrect) {
            bg = '#F0FDF4'; border = '#86EFAC'; color = '#15803D'
            letterBg = '#22C55E'; letterColor = '#FFFFFF'
          } else if (isSelected) {
            bg = '#FEF2F2'; border = '#FECACA'; color = '#B91C1C'
            letterBg = '#EF4444'; letterColor = '#FFFFFF'
          }
        } else if (isSelected) {
          bg = 'rgba(99,102,241,0.08)'; border = '#6366F1'; color = '#4F46E5'
          letterBg = '#6366F1'; letterColor = '#FFFFFF'
        }

        return (
          <button
            key={opt} type="button" disabled={disabled}
            onClick={() => !disabled && onSelect(opt)}
            className="quiz-option-btn"
            style={{
              width: '100%', padding: '13px 14px',
              textAlign: 'left', borderRadius: 12,
              border: `1.5px solid ${border}`, background: bg, color,
              fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500,
              cursor: disabled ? 'default' : 'pointer', outline: 'none',
              display: 'flex', alignItems: 'center', gap: 12,
              transition: 'all 180ms ease',
              boxShadow: isSelected && !showFeedback ? '0 2px 8px rgba(99,102,241,0.18)' : 'none',
            }}
            onMouseEnter={e => {
              if (!disabled && !isSelected && !showFeedback) {
                e.currentTarget.style.background = '#F8FAFF'
                e.currentTarget.style.borderColor = 'rgba(99,102,241,0.30)'
              }
            }}
            onMouseLeave={e => {
              if (!disabled && !isSelected && !showFeedback) {
                e.currentTarget.style.background = '#FFFFFF'
                e.currentTarget.style.borderColor = 'rgba(0,0,0,0.09)'
              }
            }}
          >
            {/* Letter circle */}
            <div style={{
              width: 28, height: 28, borderRadius: 8, flexShrink: 0,
              background: letterBg, color: letterColor,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 800, transition: 'all 180ms ease',
            }}>
              {letter}
            </div>
            {opt}
          </button>
        )
      })}
    </div>
  )
}

// ── True / False ──────────────────────────────────────────────────────────────
function TrueFalseButtons({ selected, onSelect, disabled, showFeedback, correctAnswer }: {
  selected: string; onSelect: (v: string) => void;
  disabled: boolean; showFeedback: boolean; correctAnswer: string;
}) {
  return (
    <div style={{ display: 'flex', gap: 12 }}>
      {(['True', 'False'] as const).map(val => {
        const isSelected = selected === val
        const isCorrect  = val === correctAnswer

        let bg = '#FFFFFF'; let border = 'rgba(0,0,0,0.09)'; let color = '#0F172A'
        let emoji = val === 'True' ? '✓' : '✗'

        if (showFeedback) {
          if (isCorrect) { bg = '#F0FDF4'; border = '#86EFAC'; color = '#15803D' }
          else if (isSelected) { bg = '#FEF2F2'; border = '#FECACA'; color = '#B91C1C' }
        } else if (isSelected) {
          bg = 'rgba(99,102,241,0.08)'; border = '#6366F1'; color = '#4F46E5'
        }

        return (
          <button
            key={val} type="button" disabled={disabled}
            onClick={() => !disabled && onSelect(val)}
            style={{
              flex: 1, padding: '16px 14px', borderRadius: 14,
              border: `1.5px solid ${border}`, background: bg, color,
              fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700,
              cursor: disabled ? 'default' : 'pointer', outline: 'none',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              transition: 'all 180ms ease',
              boxShadow: isSelected && !showFeedback ? '0 2px 8px rgba(99,102,241,0.18)' : 'none',
              minHeight: 68,
            }}
          >
            <span style={{ fontSize: 22 }}>{emoji}</span>
            {val}
          </button>
        )
      })}
    </div>
  )
}

// ── Fill blank ────────────────────────────────────────────────────────────────
function FillBlankInput({ value, onChange, disabled, showFeedback, isCorrect, correctAnswer }: {
  value: string; onChange: (v: string) => void; disabled: boolean;
  showFeedback: boolean; isCorrect: boolean; correctAnswer: string;
}) {
  const borderColor = showFeedback
    ? isCorrect ? '#86EFAC' : '#FECACA'
    : value.length > 0 ? '#6366F1' : 'rgba(0,0,0,0.09)'
  const bg = showFeedback
    ? isCorrect ? '#F0FDF4' : '#FEF2F2'
    : '#FFFFFF'

  return (
    <div>
      <input
        type="text" value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && !disabled && value.trim()) {} }}
        disabled={disabled}
        placeholder="Type your answer here..."
        style={{
          width: '100%', padding: '14px 16px', borderRadius: 12,
          border: `1.5px solid ${borderColor}`, background: bg,
          color: '#0F172A', fontFamily: 'var(--font-body)', fontSize: 15,
          outline: 'none', boxSizing: 'border-box',
          transition: 'border-color 200ms ease, background 200ms ease',
          boxShadow: value.length > 0 && !showFeedback ? '0 0 0 3px rgba(99,102,241,0.12)' : 'none',
        }}
      />
      {showFeedback && !isCorrect && (
        <div style={{
          fontSize: 13, color: '#15803D', marginTop: 8,
          fontWeight: 600,
        }}>
          ✓ Correct answer: <span style={{
            background: 'rgba(21,128,61,0.10)',
            padding: '2px 8px', borderRadius: 5,
          }}>{correctAnswer}</span>
        </div>
      )}
    </div>
  )
}

// ── Spoken placeholder ────────────────────────────────────────────────────────
function SpokenPlaceholder() {
  return (
    <div style={{
      padding: '32px 20px', borderRadius: 16,
      border: '1.5px dashed rgba(236,72,153,0.30)',
      background: 'rgba(236,72,153,0.04)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 12, textAlign: 'center',
    }}>
      <div style={{
        width: 54, height: 54, borderRadius: '50%',
        background: 'rgba(236,72,153,0.10)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Mic size={24} color="#EC4899" />
      </div>
      <div>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#0F172A', marginBottom: 4 }}>
          Speaking practice on the kiosk
        </div>
        <div style={{ fontSize: 13, color: '#94A3B8', maxWidth: 280, margin: '0 auto' }}>
          Visit an English AI Tutor kiosk to practise speaking with the AI tutor.
        </div>
      </div>
    </div>
  )
}
