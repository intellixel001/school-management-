'use client'

import { useState, useMemo } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
import { checkIsCorrect, formatAnswer } from '@/lib/scoring/checkIsCorrect'
import type { MockSectionAttempt, MockReadingTest, MockListeningTest } from '@/types/platform'

interface Props {
  skill: 'reading' | 'listening'
  attempt: MockSectionAttempt
  test: MockReadingTest | MockListeningTest
  viewMode: 'student' | 'teacher'
}

export function QuestionTable({ skill, attempt, test, viewMode }: Props) {
  const [showCorrect, setShowCorrect] = useState(false)

  const rows = useMemo(() => test.questions.map((q, i) => {
    const studentAns = attempt.answers[q.id]
    const isCorrect = checkIsCorrect(q, studentAns)
    return {
      index: i + 1,
      questionId: q.id,
      questionText: q.question || `Question ${i + 1}`,
      studentAnswer: formatAnswer(studentAns),
      correctAnswer: formatAnswer(q.correctAnswer),
      isCorrect,
      aiFeedback: attempt.aiQuestionFeedback?.[q.id] ?? null,
    }
  }), [attempt, test])

  const wrong = rows.filter(r => !r.isCorrect)
  const right = rows.filter(r => r.isCorrect)

  if (rows.length === 0) {
    return <div style={{ padding: 24, color: '#94A3B8' }}>No questions.</div>
  }

  return (
    <div style={{ paddingTop: 16 }}>
      {/* Wrong answers — always expanded */}
      {wrong.length > 0 && (
        <div style={{ marginBottom: showCorrect && right.length > 0 ? 16 : 0 }}>
          <Table rows={wrong} showAi />
        </div>
      )}

      {/* Right answers — collapsed behind toggle */}
      {right.length > 0 && (
        <>
          <button
            onClick={() => setShowCorrect(s => !s)}
            style={{
              width: '100%', textAlign: 'left',
              padding: '10px 14px', borderRadius: 10,
              background: 'rgba(16,185,129,0.06)',
              border: '1px solid rgba(16,185,129,0.18)',
              color: '#047857', fontSize: 13, fontWeight: 600,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}
          >
            <span>{showCorrect ? 'Hide' : 'Show'} {right.length} correct answer{right.length !== 1 ? 's' : ''}</span>
            <span style={{ fontSize: 18 }}>{showCorrect ? '▴' : '▾'}</span>
          </button>
          {showCorrect && (
            <div style={{ marginTop: 12 }}>
              <Table rows={right} showAi={false} />
            </div>
          )}
        </>
      )}

      {wrong.length === 0 && (
        <div style={{
          padding: 16, borderRadius: 12,
          background: 'rgba(16,185,129,0.08)',
          color: '#047857', fontSize: 14, fontWeight: 600,
        }}>
          All answers correct.
        </div>
      )}
    </div>
  )
}

// Mini table renderer
function Table({ rows, showAi }: { rows: Array<{ index: number; questionId: string; questionText: string; studentAnswer: string; correctAnswer: string; isCorrect: boolean; aiFeedback: string | null }>, showAi: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {rows.map(r => (
        <div key={r.questionId} style={{
          display: 'grid', gridTemplateColumns: '32px 32px 1fr 1fr', gap: 12,
          padding: '10px 12px', borderRadius: 10,
          background: r.isCorrect ? 'rgba(16,185,129,0.04)' : 'rgba(244,63,94,0.04)',
          border: `1px solid ${r.isCorrect ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.15)'}`,
          alignItems: 'start',
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#64748B' }}>Q{r.index}</div>
          <div>{r.isCorrect ? <CheckCircle2 size={18} color="#10B981" /> : <XCircle size={18} color="#F43F5E" />}</div>
          <div>
            <div style={{ fontSize: 12, color: '#64748B', marginBottom: 2 }}>Your answer</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{r.studentAnswer || '—'}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#64748B', marginBottom: 2 }}>Correct</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{r.correctAnswer}</div>
          </div>
          {showAi && r.aiFeedback && !r.isCorrect && (
            <div style={{ gridColumn: '1 / -1', marginTop: 4, paddingTop: 8, borderTop: '1px dashed rgba(244,63,94,0.20)' }}>
              <div style={{ fontSize: 12, color: '#64748B', marginBottom: 2 }}>AI note</div>
              <div style={{ fontSize: 13, color: '#334155', fontStyle: 'italic' }}>"{r.aiFeedback}"</div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
