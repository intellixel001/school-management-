'use client'

import { useState, useMemo, useEffect } from 'react'
import { Section } from './Section'
import type { MockReadingTest, MockSectionAttempt, MockReadingQuestion } from '@/types/platform'
import { readingRawToBand } from '@/lib/scoring/ieltsBands'

interface ReadingReviewDetailProps {
  reading: MockReadingTest
  attempt: MockSectionAttempt
  onScoreChange?: (raw: number, band: number) => void
  teacherFeedback?: string
  onFeedbackChange?: (text: string) => void
}

function isReadingAnswerCorrect(q: MockReadingQuestion, studentAnswer: any): boolean {
  if (typeof studentAnswer !== 'string') return false
  if (q.type === 'true-false-not-given') {
    return studentAnswer.trim().toUpperCase() === q.correctAnswer.trim().toUpperCase()
  }
  const words = studentAnswer.trim().split(/\s+/).filter(Boolean)
  if (q.maxWords && words.length > q.maxWords) return false
  return studentAnswer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()
}

export function ReadingReviewDetail({ reading, attempt, onScoreChange, teacherFeedback, onFeedbackChange }: ReadingReviewDetailProps) {
  const [overrides, setOverrides] = useState<Record<string, boolean | null>>({})

  function handleOverrideChange(questionId: string, value: boolean | null) {
    setOverrides(prev => {
      const next = { ...prev }
      if (value === null) delete next[questionId]
      else next[questionId] = value
      return next
    })
  }

  const overriddenRawScore = useMemo(() => {
    let count = 0
    for (const q of reading.questions) {
      const overridden = overrides[q.id]
      const aiCorrect = isReadingAnswerCorrect(q, attempt.answers[q.id])
      const effective = overridden ?? aiCorrect
      if (effective) count++
    }
    return count
  }, [overrides, reading, attempt])

  const currentBand = readingRawToBand(overriddenRawScore)

  useEffect(() => {
    if (onScoreChange) {
      onScoreChange(overriddenRawScore, currentBand)
    }
  }, [overriddenRawScore, currentBand, onScoreChange])

  return (
    <div>
      <Section title="Auto-grade summary">
        <div style={{ fontSize: 16, marginBottom: 8 }}>
          Raw score: <strong style={{ fontSize: 18 }}>{overriddenRawScore} / {attempt.totalQuestions}</strong>
          {overriddenRawScore !== attempt.rawScore && attempt.rawScore != null && (
            <span style={{ color: '#D97706', marginLeft: 8 }}>(AI: {attempt.rawScore})</span>
          )}
        </div>
        <div style={{ fontSize: 16 }}>
          IELTS Band (Reading): <strong style={{ color: '#4F46E5', fontSize: 18 }}>{currentBand}</strong>
        </div>
      </Section>

      <Section title="Passage" collapsible defaultCollapsed>
        <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>{reading.passageTitle}</h3>
        <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.65, color: '#374151', fontSize: 15 }}>
          {reading.passageText}
        </div>
      </Section>

      <Section title="Questions & Answers">
        <div style={{ display: 'flex', flexDirection: 'column', margin: '-20px' }}>
          {reading.questions.map((q, idx) => {
            const studentAnswer = attempt.answers[q.id]
            const aiCorrect = isReadingAnswerCorrect(q, studentAnswer)
            const teacherOverride = overrides[q.id]
            const effectiveCorrect = teacherOverride ?? aiCorrect

            return (
              <div key={q.id} style={{ padding: '16px 20px', borderBottom: '1px solid rgba(15,23,42,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'start', gap: 12 }}>
                  <span style={{ color: effectiveCorrect ? '#10B981' : '#EF4444', fontSize: 18, marginTop: 2, fontWeight: 'bold' }}>
                    {effectiveCorrect ? '✓' : '✗'}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, marginBottom: 8, color: '#111827' }}>
                      Q{idx + 1} ({q.type === 'true-false-not-given' ? 'T/F/NG' : 'Short answer'}) — {q.question}
                    </div>
                    <div style={{ fontSize: 14, color: '#374151', marginBottom: 4 }}>
                      <strong>Student:</strong> {studentAnswer || <em style={{ color: '#9CA3AF' }}>(no answer)</em>}
                    </div>
                    <div style={{ fontSize: 14, color: '#6B7280', marginBottom: 12 }}>
                      <strong>Correct:</strong> {q.correctAnswer}
                    </div>

                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, flexWrap: 'wrap' }}>
                      <span style={{ color: '#6B7280' }}>AI marked: <strong style={{ color: '#374151' }}>{aiCorrect ? 'Correct' : 'Incorrect'}</strong></span>
                      {attempt.aiQuestionFeedback?.[q.id] && !aiCorrect && (
                        <span style={{ color: '#6B7280' }}>— <span style={{ fontStyle: 'italic', color: '#4B5563' }}>"{attempt.aiQuestionFeedback[q.id]}"</span></span>
                      )}
                      {attempt.status !== 'reviewed' && (
                        <>
                          <button
                            onClick={() => handleOverrideChange(q.id, !effectiveCorrect)}
                            style={{
                              padding: '4px 10px',
                              background: teacherOverride !== undefined ? '#FEF3C7' : '#F3F4F6',
                              color: '#374151',
                              fontSize: 12,
                              borderRadius: 6,
                              border: '1px solid rgba(0,0,0,0.1)',
                              cursor: 'pointer'
                            }}
                          >
                            {teacherOverride !== undefined ? 'Override active — tap to flip' : 'Override'}
                          </button>
                          {teacherOverride !== undefined && (
                            <button
                              onClick={() => handleOverrideChange(q.id, null)}
                              style={{ fontSize: 12, color: '#6B7280', background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                            >
                              Revert to AI
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Section>

      {onFeedbackChange && teacherFeedback !== undefined && attempt.status !== 'reviewed' && (
        <Section title="Personalised feedback for the student">
          <textarea
            value={teacherFeedback}
            onChange={(e) => onFeedbackChange(e.target.value)}
            maxLength={2000}
            placeholder="Write a personalised note for this student — what they did well, what to focus on next time. Visible to them when you publish."
            rows={6}
            style={{
              width: '100%',
              padding: 16,
              fontSize: 15,
              lineHeight: 1.6,
              border: '1px solid rgba(15, 23, 42, 0.1)',
              borderRadius: 8,
              resize: 'vertical',
            }}
          />
          <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4, textAlign: 'right' }}>
            {teacherFeedback.length} / 2000
          </div>
        </Section>
      )}

      {attempt.status === 'reviewed' && attempt.teacherFeedback && (
        <Section title="Personalised feedback for the student">
          <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, color: '#374151' }}>
            {attempt.teacherFeedback}
          </div>
        </Section>
      )}
    </div>
  )
}
