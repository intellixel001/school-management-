'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { submitMockSectionAttempt } from '@/lib/services'
import type { MockExam, MockSectionAttempt, MockReadingTest, MockReadingQuestion } from '@/types/platform'
import { MockSessionHeader } from '../../../../_components/MockSessionHeader'

interface ReadingSessionScreenProps {
  mock: MockExam
  attempt: MockSectionAttempt
  reading: MockReadingTest
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

export default function ReadingSessionScreen({ mock, attempt, reading }: ReadingSessionScreenProps) {
  const [answers, setAnswers] = useState<Record<string, string>>(attempt.answers as Record<string, string> || {})
  const [secondsRemaining, setSecondsRemaining] = useState(reading.durationMinutes * 60)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false)
  
  const router = useRouter()
  const startTimeRef = useRef(Date.now())

  // Timer logic
  useEffect(() => {
    if (isSubmitting) return
    const interval = setInterval(() => {
      setSecondsRemaining(s => {
        if (s <= 1) {
          clearInterval(interval)
          handleSubmit(true) // auto-submit on expiry
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [isSubmitting])

  // Answer setters
  function selectTfngAnswer(qId: string, value: 'TRUE' | 'FALSE' | 'NOT GIVEN') {
    setAnswers(prev => ({ ...prev, [qId]: value }))
  }

  function setShortAnswer(qId: string, raw: string) {
    const value = raw.slice(0, 50)
    setAnswers(prev => ({ ...prev, [qId]: value }))
  }

  // Submit logic
  async function handleSubmit(isAutoSubmit: boolean = false) {
    if (isSubmitting) return
    if (!isAutoSubmit) {
      const answeredCount = Object.values(answers).filter(v => v && v.length > 0).length
      if (answeredCount < reading.questions.length) {
        setShowConfirmSubmit(true)
        return
      }
    }
    await doSubmit()
  }

  async function doSubmit() {
    setIsSubmitting(true)
    setShowConfirmSubmit(false)
    const durationSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000)
    try {
      await submitMockSectionAttempt(attempt.id, answers, durationSeconds)
      router.replace(`/kiosk/mock/${mock.id}/reading/submitted`)
    } catch (e) {
      setIsSubmitting(false)
      // Basic error handling for now
      alert('Failed to submit. Please try again.')
    }
  }

  const answeredCount = Object.values(answers).filter(v => v && v.length > 0).length

  // Group questions
  const tfngQuestions = reading.questions.filter(q => q.type === 'true-false-not-given')
  const shortAnswerQuestions = reading.questions.filter(q => q.type === 'short-answer')

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-[#FAFAFA] text-[#1A1A1A] overflow-hidden">
      <MockSessionHeader 
        title={`Reading · ${mock.title}`} 
        secondsRemaining={secondsRemaining} 
      />

      {/* Main Content Area: Split 40/60 vertically */}
      <div className="flex flex-col flex-1 overflow-hidden relative" style={{ height: 'calc(100vh - 160px)' }}>
        
        {/* Passage panel (sticky top, scrollable independently) */}
        <div className="overflow-y-auto" style={{ height: '45%', borderBottom: '8px solid rgba(0,0,0,0.06)', background: '#FFFFFF' }}>
          <div className="max-w-[960px] mx-auto p-8 md:p-10">
            <h2 className="font-display font-semibold mb-8" style={{ fontSize: 32, color: 'var(--text-primary)' }}>
              {reading.passageTitle}
            </h2>
            <div 
              className="font-body" 
              style={{ fontSize: 24, lineHeight: 1.8, color: '#333', whiteSpace: 'pre-wrap' }}
            >
              {reading.passageText}
            </div>
          </div>
        </div>

        {/* Questions panel (scrollable below passage) */}
        <div className="overflow-y-auto flex-1 bg-[#FAFAFA]" style={{ height: '55%' }}>
          <div className="max-w-[960px] mx-auto p-6 md:p-8 pb-32">
            
            {/* T/F/NG Section */}
            {tfngQuestions.length > 0 && (
              <div className="mb-14">
                <h3 className="font-display font-semibold mb-8" style={{ fontSize: 26 }}>
                  Questions 1-{tfngQuestions.length}: True / False / Not Given
                </h3>
                <div className="flex flex-col gap-5">
                  {tfngQuestions.map((question, idx) => {
                    const questionNumber = idx + 1
                    return (
                      <div key={question.id} className="question-card bg-white" style={{ padding: 25, border: '1px solid rgba(0,0,0,0.08)', borderRadius: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                        <p className="font-body font-medium" style={{ fontSize: 22, lineHeight: 1.6, marginBottom: 20 }}>
                          {questionNumber}. {question.question}
                        </p>
                        <div className="flex gap-3">
                          {(['TRUE', 'FALSE', 'NOT GIVEN'] as const).map(opt => (
                            <button
                              key={opt}
                              onPointerDown={() => selectTfngAnswer(question.id, opt)}
                              className="transition-colors active:scale-95 duration-100"
                              style={{
                                flex: 1,
                                minHeight: 70,
                                padding: '15px 20px',
                                borderRadius: 15,
                                border: answers[question.id] === opt ? '2px solid var(--accent-primary)' : '1px solid rgba(0,0,0,0.12)',
                                background: answers[question.id] === opt ? 'var(--accent-primary-soft)' : 'white',
                                color: answers[question.id] === opt ? 'var(--accent-primary)' : '#1A1A1A',
                                fontWeight: 600,
                                fontSize: 18,
                                cursor: 'pointer',
                              }}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Short Answer Section */}
            {shortAnswerQuestions.length > 0 && (
              <div>
                <h3 className="font-display font-semibold mb-8" style={{ fontSize: 26 }}>
                  Questions {tfngQuestions.length + 1}-{reading.questions.length}: Short Answer
                </h3>
                <div className="flex flex-col gap-5">
                  {shortAnswerQuestions.map((question, idx) => {
                    const questionNumber = tfngQuestions.length + idx + 1
                    const currentAnswer = answers[question.id] || ''
                    const count = wordCount(currentAnswer)
                    const isTooLong = question.maxWords ? count > question.maxWords : false

                    return (
                      <div key={question.id} className="question-card bg-white" style={{ padding: 25, border: '1px solid rgba(0,0,0,0.08)', borderRadius: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                        <p className="font-body font-medium" style={{ fontSize: 22, lineHeight: 1.6, marginBottom: 20 }}>
                          {questionNumber}. {question.question}
                        </p>
                        <input
                          type="text"
                          value={currentAnswer}
                          onChange={(e) => setShortAnswer(question.id, e.target.value)}
                          maxLength={50}
                          placeholder={question.maxWords ? `NO MORE THAN ${question.maxWords === 3 ? 'THREE' : question.maxWords} WORDS` : "Type your answer..."}
                          className="transition-colors font-body"
                          style={{
                            width: '100%',
                            padding: '20px 25px',
                            borderRadius: 15,
                            border: '1.5px solid rgba(0,0,0,0.12)',
                            fontSize: 20,
                            outline: 'none',
                            background: '#FAFAFA'
                          }}
                          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.background = '#FFFFFF' }}
                          onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)'; e.currentTarget.style.background = '#FAFAFA' }}
                        />
                        <p className="font-mono mt-4" style={{ fontSize: 16, color: isTooLong ? 'var(--accent-danger)' : '#666' }}>
                          {count} / {question.maxWords || 3} words
                          {isTooLong && ' — too many words; answer will be marked wrong'}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div 
        className="fixed bottom-0 left-0 right-0 bg-white flex items-center justify-between px-8 border-t border-gray-200"
        style={{ height: 100, zIndex: 100 }}
      >
        <div className="font-mono text-gray-500 font-medium" style={{ fontSize: 18 }}>
          {answeredCount} of {reading.questions.length} answered
        </div>
        <button
          onClick={() => handleSubmit(false)}
          disabled={isSubmitting}
          className="font-body font-semibold text-white transition-transform active:scale-95 disabled:opacity-50"
          style={{ background: 'var(--accent-primary)', height: 70, padding: '0 40px', borderRadius: 15, fontSize: 20 }}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Section'}
        </button>
      </div>

      {/* Confirm Submit Dialog */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-[24px] p-10 max-w-md w-full mx-4 shadow-xl">
            <h2 className="font-display font-bold text-[28px] mb-4">Submit with unanswered questions?</h2>
            <p className="font-body text-gray-600 mb-10" style={{ fontSize: 20, lineHeight: 1.5 }}>
              You've answered {answeredCount} of {reading.questions.length} questions. Unanswered questions will be marked 0.
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => setShowConfirmSubmit(false)}
                className="flex-1 py-4 px-6 rounded-[16px] font-body font-medium"
                style={{ fontSize: 20, background: 'rgba(0,0,0,0.05)', color: 'var(--text-primary)' }}
              >
                Cancel
              </button>
              <button 
                onClick={doSubmit}
                disabled={isSubmitting}
                className="flex-1 py-4 px-6 rounded-[16px] font-body font-medium text-white"
                style={{ fontSize: 20, background: 'var(--accent-primary)' }}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
