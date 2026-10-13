'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type { MockExam, MockSectionAttempt, MockWritingTest } from '@/types/platform'
import { MockSessionHeader } from '../../../../_components/MockSessionHeader'
import { INPUT_LIMITS, clampLength } from '@/lib/security/inputLimits'
import { getAccessToken } from '@/lib/api/tokens'
import { submitMockSectionAttempt } from '@/lib/services'

interface WritingSessionScreenProps {
  mock: MockExam
  attempt: MockSectionAttempt
  writing: MockWritingTest
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

export default function WritingSessionScreen({ mock, attempt, writing }: WritingSessionScreenProps) {
  const router = useRouter()

  const isWritingContentValid =
    writing.durationMinutes > 0 &&
    writing.minWords > 0 &&
    typeof writing.prompt === 'string' &&
    writing.prompt.trim().length > 0

  const [essayText, setEssayText] = useState(
    (typeof attempt.answers.essay === 'string' ? attempt.answers.essay : '') as string
  )
  const [secondsRemaining, setSecondsRemaining] = useState(
    isWritingContentValid ? writing.durationMinutes * 60 : 0
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false)

  const startTimeRef = useRef(Date.now())
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  const wordCount = useMemo(() => countWords(essayText), [essayText])
  const meetsMinimum = wordCount >= writing.minWords

  // Timer auto-submit — disabled when content is missing so we don't loop-fire submit.
  useEffect(() => {
    if (isSubmitting || !isWritingContentValid) return
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
  }, [isSubmitting, isWritingContentValid])

  async function handleSubmit(isAutoSubmit: boolean = false) {
    if (isSubmitting) return

    // Manual submit: confirm if underlength
    if (!isAutoSubmit && wordCount < writing.minWords) {
      setShowConfirmSubmit(true)
      return
    }

    await doSubmit()
  }

  async function doSubmit() {
    setIsSubmitting(true)
    const durationSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000)
    try {
      // Two-step per backend contract:
      //   1. /submit  — persists essay + moves attempt to 'submitted'
      //   2. /evaluate-writing — requires status 'submitted' or 'ai-graded'
      await submitMockSectionAttempt(attempt.id, { essay: essayText }, durationSeconds)

      const token = await getAccessToken()
      const res = await fetch('/api/mock-writing-evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          attemptId: attempt.id,
          essayText,
          durationSeconds,
        }),
      })
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`)
      }
      router.replace(`/kiosk/mock/${mock.id}/writing/submitted`)
    } catch (err) {
      setIsSubmitting(false)
      alert('Failed to submit essay. Please try again.')
      console.error('[Writing submit] Failed:', err)
    }
  }

  if (!isWritingContentValid) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-[100dvh] gap-6 px-8 text-center bg-[#FAFAFA]">
        <div style={{ fontSize: 40 }}>⚠</div>
        <h2 className="font-display font-semibold text-2xl text-gray-900">
          This writing section isn&apos;t ready yet
        </h2>
        <p className="font-body text-gray-600 max-w-md" style={{ fontSize: 17, lineHeight: 1.5 }}>
          The backend returned incomplete writing content (missing duration, minimum word count,
          or prompt). Ask an administrator to publish the section before starting.
        </p>
        <button
          onClick={() => router.push('/kiosk/mock')}
          className="px-6 py-3 rounded-md text-white font-medium shadow-sm transition-transform active:scale-95"
          style={{ background: '#D97706' }}
        >
          Back to mock list
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-[#FAFAFA] text-[#1A1A1A] overflow-hidden">
      <MockSessionHeader 
        title={`Writing · ${mock.title}`} 
        secondsRemaining={secondsRemaining} 
        onEndSession={() => {
          router.push('/kiosk/mock')
        }}
        endWarningText="Your essay will be lost. This cannot be undone."
      />

      <div className="flex-1 overflow-y-auto px-6 py-8 pb-32">
        <div className="max-w-[960px] mx-auto flex flex-col gap-8">

          {/* ── Task Briefing (mirrors NCL "WRITING TASK 2" cover page) ─── */}
          <div className="bg-white rounded-[20px] shadow-sm border border-gray-200 overflow-hidden">
            <div style={{ padding: '36px 44px' }}>
              {/* Formal heading with underline */}
              <div style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                paddingBottom: 14,
                borderBottom: '2px solid #1F2937',
                marginBottom: 20,
              }}>
                <h2 className="font-display" style={{
                  fontSize: 32, fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '0.5px',
                }}>
                  WRITING TASK {writing.taskNumber}
                </h2>
                <span className="font-mono" style={{
                  fontSize: 15, color: '#6B7280', fontWeight: 600, letterSpacing: '1px',
                }}>
                  {writing.durationMinutes} MINUTES
                </span>
              </div>

              <p className="font-body" style={{ fontSize: 19, color: '#374151', lineHeight: 1.6, margin: 0 }}>
                You should spend about {writing.durationMinutes} minutes on this task.
              </p>

              <p className="font-body" style={{
                fontSize: 19, color: '#374151', lineHeight: 1.6, margin: '14px 0 20px', fontWeight: 500,
              }}>
                Write about the following topic:
              </p>

              {/* Bordered prompt box — the boxed callout on the NCL paper */}
              <div style={{
                border: '2px solid #2563EB',
                borderRadius: 12,
                padding: '28px 36px',
                background: 'linear-gradient(180deg, #EFF6FF 0%, #DBEAFE 100%)',
                margin: '4px 0 26px',
                boxShadow: '0 1px 3px rgba(37, 99, 235, 0.10), inset 0 1px 0 rgba(255,255,255,0.6)',
              }}>
                <h3 className="font-display" style={{
                  fontStyle: 'italic',
                  fontSize: 26,
                  fontWeight: 700,
                  color: '#1E3A8A',
                  textAlign: 'center',
                  lineHeight: 1.4,
                  margin: 0,
                }}>
                  {writing.prompt}
                </h3>
                {writing.promptDescription && (
                  <p className="font-body" style={{
                    fontSize: 18,
                    color: '#1E40AF',
                    lineHeight: 1.7,
                    textAlign: 'center',
                    margin: '16px 0 0',
                    whiteSpace: 'pre-wrap',
                  }}>
                    {writing.promptDescription}
                  </p>
                )}
              </div>

              {/* Instructions from data (was hardcoded before) */}
              <p className="font-body" style={{
                fontSize: 18, color: '#1F2937', lineHeight: 1.65, margin: '0 0 22px',
              }}>
                {writing.instructions}
              </p>

              {/* Minimum word count */}
              <p className="font-body" style={{
                fontSize: 19, fontWeight: 700, color: '#0F172A', margin: 0,
              }}>
                Write at least {writing.minWords} words
              </p>
            </div>
          </div>

          {/* ── Writing Answer Sheet (mirrors NCL answer sheet) ─────────── */}
          <div className="bg-white rounded-[20px] shadow-sm border border-gray-200 overflow-hidden">
            {/* Answer sheet header */}
            <div style={{ padding: '24px 44px', borderBottom: '1px solid #E5E7EB' }}>
              <h2 className="font-display" style={{
                fontSize: 22, fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '0.5px', lineHeight: 1.2,
              }}>
                WRITING ANSWER SHEET
              </h2>
              <p className="font-display" style={{
                fontSize: 18, fontWeight: 700, color: '#0F172A', margin: '4px 0 0', letterSpacing: '0.5px',
              }}>
                TASK {writing.taskNumber}
              </p>
            </div>

            {/* Ruled writing canvas */}
            <div style={{ padding: '28px 44px 36px' }}>
              <textarea
                ref={textareaRef}
                value={essayText}
                onChange={(e) => setEssayText(clampLength(e.target.value, INPUT_LIMITS.WRITING_CANVAS))}
                maxLength={INPUT_LIMITS.WRITING_CANVAS}
                placeholder="Begin writing your response here…"
                autoFocus
                style={{
                  width: '100%',
                  minHeight: '58vh',
                  padding: '0 4px 40px',
                  fontSize: 22,
                  lineHeight: '44px',
                  color: '#1F2937',
                  border: 'none',
                  // Ruled paper — repeating horizontal lines every 44px matches lineHeight
                  background:
                    'repeating-linear-gradient(to bottom, transparent 0, transparent 43px, #E5E7EB 43px, #E5E7EB 44px)',
                  resize: 'none',
                  outline: 'none',
                  fontFamily: 'var(--font-body, system-ui, sans-serif)',
                }}
              />
            </div>
          </div>

        </div>
      </div>

      {/* Footer action bar */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(8px)',
        borderTop: '1px solid rgba(15, 23, 42, 0.08)',
        padding: '20px 32px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.05)',
        zIndex: 100
      }}>
        <div className="w-full max-w-[960px] flex justify-between items-center px-4">
          <span style={{
            fontFamily: 'JetBrains Mono',
            fontSize: 18,
            color: meetsMinimum ? '#059669' : '#6B7280',
            fontWeight: 600,
          }}>
            {wordCount} / {writing.minWords} words
            {meetsMinimum && ' ✓'}
          </span>
          <button
            onClick={() => handleSubmit(false)}
            disabled={isSubmitting || wordCount === 0}
            style={{
              minHeight: 70,
              padding: '0 40px',
              borderRadius: 15,
              background: isSubmitting || wordCount === 0 ? 'rgba(0,0,0,0.12)' : '#D97706',     // amber for Writing
              color: isSubmitting || wordCount === 0 ? 'rgba(0,0,0,0.4)' : 'white',
              fontWeight: 600,
              fontSize: 20,
              border: 'none',
              cursor: isSubmitting || wordCount === 0 ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {isSubmitting ? 'Evaluating…' : 'Submit Section'}
          </button>
        </div>
      </div>

      {/* Confirm dialog when underlength */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-[24px] p-10 max-w-md w-full mx-4 shadow-xl">
            <h2 className="font-display font-bold text-[28px] mb-4">Submit below the minimum word count?</h2>
            <p className="font-body text-gray-600 mb-10" style={{ fontSize: 20, lineHeight: 1.5 }}>
              You've written {wordCount} of {writing.minWords} words. Your essay will be flagged as underlength, which lowers the score.
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => setShowConfirmSubmit(false)}
                className="flex-1 py-4 px-6 rounded-[16px] font-body font-medium"
                style={{ fontSize: 20, background: 'rgba(0,0,0,0.05)', color: 'var(--text-primary)' }}
              >
                Keep writing
              </button>
              <button 
                onClick={doSubmit}
                disabled={isSubmitting}
                className="flex-1 py-4 px-6 rounded-[16px] font-body font-medium text-white"
                style={{ fontSize: 20, background: '#D97706' }}
              >
                {isSubmitting ? 'Evaluating...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
