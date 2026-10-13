'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { submitMockSectionAttempt } from '@/lib/services'
import { stopSpeaking } from '@/lib/speechUtils'
import type { MockExam, MockSectionAttempt, MockListeningTest, MockListeningQuestion, MockListeningFormContext } from '@/types/platform'
import { MockSessionHeader } from '../../../../_components/MockSessionHeader'
import AudioPlayer from './AudioPlayer'
import McqSingleQuestion from './listening-questions/McqSingleQuestion'
import McqMultiQuestion from './listening-questions/McqMultiQuestion'
import MatchingQuestion from './listening-questions/MatchingQuestion'
import NotesFillContextRenderer from './listening-questions/NotesFillContextRenderer'

interface ListeningSessionScreenProps {
  mock: MockExam
  attempt: MockSectionAttempt
  listening: MockListeningTest
}

type RenderItem =
  | { kind: 'context'; context: MockListeningFormContext; questions: MockListeningQuestion[]; recordingId?: string }
  | { kind: 'standalone'; question: MockListeningQuestion }

function buildRenderPlan(listening: MockListeningTest): RenderItem[] {
  const plan: RenderItem[] = []
  const seenContextIds = new Set<string>()
  for (const q of listening.questions) {
    if (q.formContextId) {
      if (!seenContextIds.has(q.formContextId)) {
        const ctx = listening.formContexts.find(c => c.id === q.formContextId)
        if (ctx) {
          const ctxQuestions = listening.questions.filter(qq => qq.formContextId === ctx.id)
          plan.push({ kind: 'context', context: ctx, questions: ctxQuestions, recordingId: ctxQuestions[0]?.recordingId })
          seenContextIds.add(ctx.id)
        }
      }
    } else {
      plan.push({ kind: 'standalone', question: q })
    }
  }
  return plan
}

/**
 * Build a Map<questionId, displayLabel> where the label is either "1" or
 * "1 and 2" (for mcq-multi with numberToSelect > 1). Numbering starts from
 * each recording's questionRange.from, so tests with restarted numbering
 * (per NCL: Sec 1&2 = Q1-20, Sec 3&4 = Q1-20 again) display correctly.
 */
function buildDisplayNumbers(listening: MockListeningTest): Map<string, string> {
  const map = new Map<string, string>()
  for (const rec of listening.recordings) {
    const qsInRec = listening.questions.filter(q => q.recordingId === rec.id)
    let currentNum = rec.questionRange.from
    for (const q of qsInRec) {
      const slots = q.type === 'mcq-multi' ? (q.numberToSelect ?? 2) : 1
      map.set(q.id, slots > 1 ? `${currentNum} and ${currentNum + slots - 1}` : `${currentNum}`)
      currentNum += slots
    }
  }
  return map
}

function countAnswered(ans: Record<string, string | string[]>, questions: MockListeningQuestion[]): number {
  let count = 0
  for (const q of questions) {
    const v = ans[q.id]
    if (v === undefined || v === null) continue
    if (Array.isArray(v)) {
      const required = q.numberToSelect ?? 2
      if (v.length >= required) count++
    } else if (typeof v === 'string' && v.trim().length > 0) {
      count++
    }
  }
  return count
}

export default function ListeningSessionScreen({ mock, attempt, listening }: ListeningSessionScreenProps) {
  const router = useRouter()

  const isListeningContentValid =
    listening.durationMinutes > 0 &&
    Array.isArray(listening.recordings) &&
    listening.recordings.length > 0 &&
    Array.isArray(listening.questions) &&
    listening.questions.length > 0

  const [answers, setAnswers] = useState<Record<string, string | string[]>>(
    (attempt.answers as Record<string, string | string[]>) || {}
  )

  const [currentRecordingIndex, setCurrentRecordingIndex] = useState(0)
  const [audioState, setAudioState] = useState<'idle' | 'playing' | 'paused' | 'finished'>('idle')

  const [secondsRemaining, setSecondsRemaining] = useState(
    isListeningContentValid ? listening.durationMinutes * 60 : 0
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false)

  const startTimeRef = useRef(Date.now())

  // Render planner memo
  const renderPlan     = useMemo(() => buildRenderPlan(listening), [listening])
  const displayNumbers = useMemo(() => buildDisplayNumbers(listening), [listening])

  // Timer auto-submit — disabled when content is missing so we don't loop-fire submit.
  useEffect(() => {
    if (isSubmitting || !isListeningContentValid) return
    const interval = setInterval(() => {
      setSecondsRemaining(s => {
        if (s <= 1) {
          clearInterval(interval)
          handleSubmit(true)
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [isSubmitting, isListeningContentValid])

  function setAnswer(questionId: string, value: string | string[]) {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
  }

  async function handleSubmit(isAutoSubmit: boolean = false) {
    if (isSubmitting) return
    if (!isAutoSubmit) {
      const answeredCount = countAnswered(answers, listening.questions)
      if (answeredCount < listening.questions.length) {
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
      stopSpeaking() // halt audio
      router.replace(`/kiosk/mock/${mock.id}/listening/submitted`)
    } catch (e) {
      setIsSubmitting(false)
      alert('Failed to submit. Please try again.')
    }
  }

  const answeredCount = countAnswered(answers, listening.questions)

  if (!isListeningContentValid) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-[100dvh] gap-6 px-8 text-center bg-[#FAFAFA]">
        <div style={{ fontSize: 40 }}>⚠</div>
        <h2 className="font-display font-semibold text-2xl text-gray-900">
          This listening section isn&apos;t ready yet
        </h2>
        <p className="font-body text-gray-600 max-w-md" style={{ fontSize: 17, lineHeight: 1.5 }}>
          The backend returned no audio recordings (or no questions) for this mock. Ask an
          administrator to publish the section before starting.
        </p>
        <button
          onClick={() => router.push('/kiosk/mock')}
          className="px-6 py-3 rounded-md text-white font-medium shadow-sm transition-transform active:scale-95"
          style={{ background: '#7C3AED' }}
        >
          Back to mock list
        </button>
      </div>
    )
  }

  function renderPlanItem(item: RenderItem) {
    if (item.kind === 'context') {
      return (
        <NotesFillContextRenderer
          key={item.context.id}
          context={item.context}
          questions={item.questions}
          answers={answers}
          displayNumbers={displayNumbers}
          onChange={(qId, value) => setAnswer(qId, value)}
        />
      )
    }

    const q = item.question
    const displayLabel = displayNumbers.get(q.id) ?? ''
    const value = answers[q.id]

    switch (q.type) {
      case 'mcq-single':
        return (
          <McqSingleQuestion
            key={q.id}
            question={q}
            questionNumberLabel={displayLabel}
            value={typeof value === 'string' ? value : ''}
            onChange={(v) => setAnswer(q.id, v)}
          />
        )
      case 'mcq-multi':
        return (
          <McqMultiQuestion
            key={q.id}
            question={q}
            questionNumberLabel={displayLabel}
            value={Array.isArray(value) ? value : []}
            onChange={(v) => setAnswer(q.id, v)}
          />
        )
      case 'matching':
        return (
          <MatchingQuestion
            key={q.id}
            question={q}
            questionNumberLabel={displayLabel}
            value={typeof value === 'string' ? value : ''}
            onChange={(v) => setAnswer(q.id, v)}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-[#FAFAFA] text-[#1A1A1A] overflow-hidden">
      <MockSessionHeader 
        title={`Listening · ${mock.title}`} 
        secondsRemaining={secondsRemaining} 
        onEndSession={() => {
          stopSpeaking()
          router.push('/kiosk/mock')
        }}
      />

      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-[960px] mx-auto flex flex-col gap-8 pb-32">
          
          {/* Audio Player */}
          {listening.recordings.length > 0 && (
            <AudioPlayer
              recordings={listening.recordings}
              currentIndex={currentRecordingIndex}
              onAdvance={() => setCurrentRecordingIndex(i => Math.min(i + 1, listening.recordings.length - 1))}
              onPrevious={() => setCurrentRecordingIndex(i => Math.max(i - 1, 0))}
              audioState={audioState}
              onAudioStateChange={setAudioState}
            />
          )}

          {/* Sections */}
          {listening.recordings.map((recording, idx) => {
            // Group render items by recordingId (explicit link — no fragile regex).
            // Contexts belong to a recording if their first question does.
            const sectionItems = renderPlan.filter(item => {
              if (item.kind === 'standalone') return item.question.recordingId === recording.id
              return item.recordingId === recording.id
            })

            if (sectionItems.length === 0) return null

            return (
              <div key={idx} className="mt-5">
                <h2 className="font-display font-semibold text-[26px] mb-8 text-gray-900 border-b border-gray-200 pb-4">
                  Section {idx + 1}: {recording.title || 'Untitled Section'}
                </h2>
                
                <div className="flex flex-col gap-4">
                  {sectionItems.map(item => renderPlanItem(item))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div 
        className="fixed bottom-0 left-0 right-0 bg-white flex items-center justify-between px-8 border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]"
        style={{ height: 100, zIndex: 100 }}
      >
        <div className="font-mono text-gray-500 font-medium" style={{ fontSize: 18 }}>
          {answeredCount} of {listening.questions.length} answered
        </div>
        <button
          onClick={() => handleSubmit(false)}
          disabled={isSubmitting}
          className="font-body font-semibold text-white transition-transform active:scale-95 disabled:opacity-50"
          style={{ background: '#7C3AED', height: 70, padding: '0 40px', borderRadius: 15, fontSize: 20 }}
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
              You've answered {answeredCount} of {listening.questions.length} questions. Unanswered questions will be marked 0.
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
                style={{ fontSize: 20, background: '#7C3AED' }}
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
