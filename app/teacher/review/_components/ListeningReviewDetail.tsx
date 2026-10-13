'use client'

import { useState, useMemo, useEffect } from 'react'
import { Section } from './Section'
import type { MockListeningTest, MockSectionAttempt, MockListeningQuestion } from '@/types/platform'
import { listeningRawToBand } from '@/lib/scoring/ieltsBands'

interface ListeningReviewDetailProps {
  listening: MockListeningTest
  attempt: MockSectionAttempt
  onScoreChange?: (raw: number, band: number) => void
  teacherFeedback?: string
  onFeedbackChange?: (text: string) => void
}

function isListeningAnswerCorrect(q: MockListeningQuestion, studentAnswer: any): boolean {
  if (studentAnswer === undefined || studentAnswer === null) return false
  if (q.type === 'mcq-multi' && Array.isArray(q.correctAnswer)) {
    if (!Array.isArray(studentAnswer)) return false
    const correctSet = new Set(q.correctAnswer.map(s => s.toUpperCase()))
    const studentSet = new Set(studentAnswer.map(s => s.toUpperCase()))
    return correctSet.size === studentSet.size && [...correctSet].every(x => studentSet.has(x))
  } else if (typeof q.correctAnswer === 'string' && typeof studentAnswer === 'string') {
    return studentAnswer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()
  }
  return false
}

function getQuestionLabel(q: MockListeningQuestion): string {
  if (q.label) return `"${q.label} ___"`
  if (q.question) return q.question
  return `(Question)`
}

export function ListeningReviewDetail({ listening, attempt, onScoreChange, teacherFeedback, onFeedbackChange }: ListeningReviewDetailProps) {
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
    for (const q of listening.questions) {
      const overridden = overrides[q.id]
      const aiCorrect = isListeningAnswerCorrect(q, attempt.answers[q.id])
      const effective = overridden ?? aiCorrect
      if (effective) count++
    }
    return count
  }, [overrides, listening, attempt])

  const currentBand = listeningRawToBand(overriddenRawScore, attempt.totalQuestions)

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
          IELTS Band (Listening): <strong style={{ color: '#7C3AED', fontSize: 18 }}>{currentBand}</strong>
        </div>
      </Section>

      <Section title="Recordings (transcripts)" collapsible defaultCollapsed>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {listening.recordings.map((rec, i) => (
            <div key={rec.id}>
              <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Recording {i + 1} — {rec.title}</h4>
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.65, color: '#374151', fontSize: 14, background: '#FAFAFA', padding: 16, borderRadius: 8, border: '1px solid rgba(0,0,0,0.05)' }}>
                {rec.audioScript || <em style={{ color: '#9CA3AF' }}>[Audio script not provided]</em>}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Questions & Answers">
        <div style={{ display: 'flex', flexDirection: 'column', margin: '-20px' }}>
          {listening.questions.map((q, idx) => {
            const studentAnswer = attempt.answers[q.id]
            const aiCorrect = isListeningAnswerCorrect(q, studentAnswer)
            const teacherOverride = overrides[q.id]
            const effectiveCorrect = teacherOverride ?? aiCorrect

            const label = getQuestionLabel(q)
            
            let typeName: string = q.type
            if (q.type === 'notes-form-fill') typeName = 'Form fill'
            if (q.type === 'notes-bullet-fill') typeName = 'Bullet fill'
            if (q.type === 'mcq-single') typeName = 'MCQ A/B/C'
            if (q.type === 'mcq-multi') typeName = 'Multi-select'
            if (q.type === 'matching') typeName = 'Matching'

            let studentDisplay = String(studentAnswer)
            if (Array.isArray(studentAnswer)) studentDisplay = studentAnswer.join(', ')
            if (!studentAnswer || (Array.isArray(studentAnswer) && studentAnswer.length === 0)) {
              studentDisplay = ''
            }

            let correctDisplay = String(q.correctAnswer)
            if (Array.isArray(q.correctAnswer)) correctDisplay = q.correctAnswer.join(', ')

            return (
              <div key={q.id} style={{ padding: '16px 20px', borderBottom: '1px solid rgba(15,23,42,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'start', gap: 12 }}>
                  <span style={{ color: effectiveCorrect ? '#10B981' : '#EF4444', fontSize: 18, marginTop: 2, fontWeight: 'bold' }}>
                    {effectiveCorrect ? '✓' : '✗'}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, marginBottom: 8, color: '#111827' }}>
                      Q{idx + 1} ({typeName}) — {label}
                    </div>
                    <div style={{ fontSize: 14, color: '#374151', marginBottom: 4 }}>
                      <strong>Student:</strong> {studentDisplay || <em style={{ color: '#9CA3AF' }}>(no answer)</em>}
                    </div>
                    <div style={{ fontSize: 14, color: '#6B7280', marginBottom: 12 }}>
                      <strong>Correct:</strong> {correctDisplay}
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
