'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, ArrowLeft } from 'lucide-react'
import { Spinner, Badge } from '@/components/ui'
import { getStudentById, getRandomPracticePassage } from '@/lib/services'
import { createPracticeSession } from '@/lib/services/practice'
import { SKILL_CONFIG } from '@/lib/skillConfig'
import { INPUT_LIMITS, clampLength } from '@/lib/security/inputLimits'
import { speakText, stopSpeaking } from '@/lib/speechUtils'
import type { Student, ReadingPassage, ReadingQuestion } from '@/types/platform'
import type { EvaluateSessionResponse } from '@/app/api/evaluate-session/route'
import { useKioskSession } from '../../_components/KioskSessionProvider'

import SessionIntroScreen from '../[skill]/_components/SessionIntroScreen'
import SessionCompleteScreen from '../[skill]/_components/SessionCompleteScreen'
import EndSessionModal from '../_components/EndSessionModal'

type PracticeState = 'loading' | 'intro' | 'question' | 'evaluating' | 'results' | 'error'

const LEVEL_SHORT: Record<string, string> = {
  'entry-1': 'E1', 'entry-2': 'E2', 'entry-3': 'E3', 'level-1': 'L1',
}

const TOTAL_QUESTIONS = 5

function generateUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export default function KioskReadingPracticePage() {
  const router = useRouter()
  const { session: kioskSession, clear } = useKioskSession()

  const [state, setState] = useState<PracticeState>('loading')
  const [student, setStudent] = useState<Student | null>(null)
  const [passage, setPassage] = useState<ReadingPassage | null>(null)
  const [questions, setQuestions] = useState<ReadingQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<string[]>(['', '', '', '', ''])
  const [evaluation, setEvaluation] = useState<EvaluateSessionResponse | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [pointsAwarded, setPointsAwarded] = useState<number | null>(null)
  const [updatedTotalPoints, setUpdatedTotalPoints] = useState<number | null>(null)
  const [sessionId] = useState(generateUuid)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  // ─── Load ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!kioskSession) { router.replace('/kiosk'); return }
    let cancelled = false
    async function load() {
      try {
        const s = await getStudentById(kioskSession!.studentId)
        if (cancelled || !s) { if (!cancelled) setState('error'); return }
        const p = await getRandomPracticePassage(s.level, 'reading') as ReadingPassage
        if (!cancelled) {
          setStudent(s)
          setPassage(p)
          setQuestions(p.questions.slice(0, TOTAL_QUESTIONS) as ReadingQuestion[])
          setState('intro')
        }
      } catch { if (!cancelled) setState('error') }
    }
    load()
    return () => { cancelled = true }
  }, [kioskSession, router])

  // ─── Timer ───────────────────────────────────────────────────────────────

  useEffect(() => {
    if (state === 'question' || state === 'evaluating') {
      timerRef.current = setInterval(() => setElapsedSeconds(p => p + 1), 1000)
    }
    return () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null } }
  }, [state])

  // ─── Autofocus textarea ──────────────────────────────────────────────────

  useEffect(() => {
    if (state === 'question' && questions[currentIndex]?.type === 'open') {
      setTimeout(() => textareaRef.current?.focus(), 50)
    }
  }, [currentIndex, state, questions])

  // ─── AI tutor voice: intro-screen greeting ───────────────────────────────
  //
  // Guides the student through the intro card. Fires once per intro visit;
  // stops as soon as they hit Start Session (state transitions away) or leave.
  useEffect(() => {
    if (state !== 'intro') return
    const line =
      "The AI tutor will present a short passage and ask you questions. Take your time reading before you respond"
    const id = window.setTimeout(() => speakText(line), 500)
    return () => {
      window.clearTimeout(id)
      stopSpeaking()
    }
  }, [state])

  // ─── AI tutor voice: speak the question text ─────────────────────────────
  //
  // Fires once per question. Reads ONLY the question — MCQ options are read
  // by the student themselves (they need to see + read the letters/text to
  // pick). Any in-flight utterance is cancelled when the index changes, when
  // we leave the question state, or when the component unmounts.
  useEffect(() => {
    if (state !== 'question') return
    const q = questions[currentIndex]
    if (!q?.question) return

    const id = window.setTimeout(() => speakText(q.question), 400)
    return () => {
      window.clearTimeout(id)
      stopSpeaking()
    }
  }, [state, currentIndex, questions])

  // ─── Evaluate session ────────────────────────────────────────────────────

  const evaluateSession = useCallback(async (allAnswers: string[]) => {
    if (!passage || !kioskSession) return
    setState('evaluating')
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }

    const payload = {
      skillArea: 'reading' as const,
      level: kioskSession.level,
      contentId: passage.id,
      contentText: passage.text,
      questions: questions.map((q, i) => ({
        id: q.id,
        type: q.type as 'mcq' | 'open',
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        studentAnswer: allAnswers[i] || '',
      })),
    }

    try {
      const res = await fetch('/api/evaluate-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(`API ${res.status}`)
      const data: EvaluateSessionResponse = await res.json()
      setEvaluation(data)

      // Persist
      const result = await createPracticeSession({
        studentId: kioskSession.studentId,
        skill: 'reading',
        level: kioskSession.level,
        correctCount: data.correctCount,
        totalQuestions: TOTAL_QUESTIONS,
        durationSec: elapsedSeconds,
      })
      setPointsAwarded(result.pointsAwarded)
      setUpdatedTotalPoints(result.student.totalPoints)
      setState('results')
    } catch (err) {
      console.error('[Reading] evaluateSession failed', err)
      setEvaluation({
        overallScore: 0, correctCount: 0,
        perQuestion: questions.map(q => ({ questionId: q.id, isCorrect: false, feedback: 'Could not evaluate — please try again later.' })),
        overallFeedback: 'We were unable to evaluate this session. Your answers were recorded but no points were awarded.',
      })
      setState('results')
    }
  }, [passage, kioskSession, questions, elapsedSeconds, sessionId])

  // ─── Handle answer ────────────────────────────────────────────────────────

  const selectAnswer = useCallback((answer: string) => {
    const next = [...answers]
    next[currentIndex] = answer
    setAnswers(next)
  }, [answers, currentIndex])

  const handleNext = useCallback(() => {
    if (currentIndex < TOTAL_QUESTIONS - 1) {
      setCurrentIndex(i => i + 1)
    } else {
      evaluateSession(answers)
    }
  }, [currentIndex, evaluateSession, answers])

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(i => i - 1)
    }
  }, [currentIndex])

  // ─── End mid-session ─────────────────────────────────────────────────────

  const [showEndConfirm, setShowEndConfirm] = useState(false)

  const handleEnd = useCallback(() => {
    setShowEndConfirm(true)
  }, [])

  const confirmEnd = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    setShowEndConfirm(false)
    router.push('/kiosk/practice')
  }, [router])

  // ─── Helpers ─────────────────────────────────────────────────────────────

  const formatTimer = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`
  const skillConfig = SKILL_CONFIG['reading']
  const SkillIcon = skillConfig.icon
  const accentColor = skillConfig.iconColor || '#6366F1'
  const currentQuestion = questions[currentIndex]
  const currentAnswer = answers[currentIndex] || ''
  const progressPct = ((currentIndex) / TOTAL_QUESTIONS) * 100

  // ─── Error ───────────────────────────────────────────────────────────────

  if (state === 'loading') {
    return (
      <div data-theme="dark" className="relative w-screen h-[100dvh] overflow-hidden bg-[var(--bg-base)]">
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <Spinner size="lg" color="#E8B96C" />
        </div>
      </div>
    )
  }
  if (state === 'error') {
    return (
      <div data-theme="dark" className="relative w-screen h-[100dvh] overflow-hidden bg-[var(--bg-base)]">
        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center w-full h-full gap-6 px-8 text-center"
        >
          <div style={{ fontSize: 72, color: '#F59E0B' }}>⚠</div>
          <h2 className="font-display font-semibold" style={{ fontSize: 44, color: 'var(--text-primary)' }}>
            Failed to load session
          </h2>
          <p className="font-body" style={{ fontSize: 22, color: 'var(--text-secondary)', maxWidth: 600, lineHeight: 1.5 }}>
            We couldn&apos;t load your reading practice. Please try again or ask staff for help.
          </p>
          <button
            onClick={() => router.push('/kiosk/practice')}
            style={{
              marginTop: 16, padding: '16px 40px', borderRadius: 16,
              background: '#E8B96C', color: '#120A08', border: 'none',
              fontSize: 24, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Back to practice menu
          </button>
        </div>
      </div>
    )
  }

  return (
    <div data-theme="dark" className="relative flex flex-col w-screen h-[100dvh] bg-[var(--bg-base)] overflow-hidden">
      <div className="relative z-10 flex flex-col w-full h-full">
        {/* Header */}
        <header className="relative flex items-center justify-center shrink-0 px-8 py-4 z-10" 
          style={{ minHeight: 120 }}>
        <div className="flex items-center gap-4">
          <SkillIcon size={32} style={{ color: accentColor }} />
          <span className="font-display font-semibold text-white text-3xl">{skillConfig.label}</span>
          {student && <Badge size="md" style={{ transform: 'scale(1.2)', transformOrigin: 'left' }}>{LEVEL_SHORT[student.level]}</Badge>}
          {(state === 'question' || state === 'evaluating') && (
            <span className="font-mono text-[var(--text-secondary)] text-3xl ml-4">{formatTimer(elapsedSeconds)}</span>
          )}
        </div>
        <button
          onClick={() => {
            if (state === 'question') {
              handleEnd()
            } else {
              clear()
              router.replace('/kiosk')
            }
          }}
          className="absolute right-8 border px-6 py-4 rounded-xl transition-colors flex items-center gap-3 text-2xl font-bold cursor-pointer"
          style={{
            background: 'rgba(239, 68, 68, 0.1)', // soft red translucent
            borderColor: 'rgba(239, 68, 68, 0.3)',
            color: '#FCA5A5' // light red
          }}
        >
          <LogOut size={28} /> End
        </button>
      </header>

      {/* Bottom-left back button during intro */}
      {state === 'intro' && (
        <button
          onClick={() => router.push('/kiosk/practice')}
          onPointerDown={(e) => { e.currentTarget.style.transform = 'scale(0.94)' }}
          onPointerUp={(e)   => { e.currentTarget.style.transform = 'scale(1)' }}
          onPointerLeave={(e)=> { e.currentTarget.style.transform = 'scale(1)' }}
          aria-label="Back to practice menu"
          className="absolute z-50 flex items-center justify-center"
          style={{
            bottom: 48,
            left: 48,
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '0 27px', height: 71,
            borderRadius: 15,
            border: '1px solid rgba(255,255,255,0.14)',
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(24px) saturate(140%)',
            WebkitBackdropFilter: 'blur(24px) saturate(140%)',
            color: 'var(--text-primary)',
            cursor: 'pointer', outline: 'none',
            transition: 'transform 100ms ease, background 100ms ease',
          }}
        >
          <ArrowLeft size={27} />
          <span className="font-display font-bold" style={{ fontSize: 24 }}>Back</span>
        </button>
      )}

      <div className="flex-1 flex flex-col" style={{ minHeight: 0, overflow: 'hidden' }}>
        {/* Intro */}
        {state === 'intro' && student && passage && (
          <SessionIntroScreen
            skill="reading"
            levelShort={LEVEL_SHORT[student.level]}
            content={passage}
            onStart={() => setState('question')}
          />
        )}

        {/* Question — responsive layout: side-by-side on wide/landscape,
            stacked (passage on top, question below) on tall/portrait kiosks
            where the side-by-side split leaves the passage cramped and the
            question column half-empty. */}
        {state === 'question' && passage && currentQuestion && (
          <div className="reading-split flex-1 w-full h-full" style={{ minHeight: 0, display: 'flex', padding: '0 32px 32px 32px', gap: '32px' }}>
            {/* Passage panel */}
            <div className="reading-passage h-full overflow-y-auto"
              style={{ 
                padding: '48px 56px', 
                background: 'rgba(255, 255, 255, 0.02)', 
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '32px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)'
              }}>
              <h1 className="font-display font-bold text-white mb-6" style={{ fontSize: 44, letterSpacing: '-0.02em' }}>
                {passage.title}
              </h1>
              <p className="font-body leading-relaxed whitespace-pre-wrap" style={{ fontSize: 28, color: 'var(--text-secondary)' }}>
                {passage.text}
              </p>
            </div>

            {/* Question panel */}
            <div className="reading-question flex flex-col h-full overflow-hidden"
              style={{ 
                background: 'rgba(255, 255, 255, 0.02)', 
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '32px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)'
              }}>
              <style>{`
                .reading-split { flex-direction: row; }
                .reading-passage { width: 55%; }
                .reading-question { width: 45%; }
                @media (max-aspect-ratio: 1/1) {
                  .reading-split { flex-direction: column; padding: 0 24px 24px 24px !important; gap: 24px !important; }
                  .reading-passage {
                    width: 100%; max-height: 45%;
                  }
                  .reading-question { width: 100%; flex: 1; }
                }
              `}</style>
              {/* Progress bar */}
              <div style={{ padding: '48px 48px 0' }}>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono font-bold uppercase tracking-widest"
                    style={{ fontSize: 20, color: accentColor }}>
                    Question {currentIndex + 1} of {TOTAL_QUESTIONS}
                  </span>
                </div>
                <div style={{ height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', background: '#E8B96C',
                    width: `${progressPct + (1 / TOTAL_QUESTIONS) * 100}%`,
                    borderRadius: 4, transition: 'width 200ms ease',
                  }} />
                </div>
              </div>

              {/* Question text */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '48px 48px 0' }}>
                <h2 className="font-display font-semibold text-white" style={{ fontSize: 36, lineHeight: 1.5, marginBottom: 32 }}>
                  {currentQuestion.question}
                </h2>

                {/* MCQ options */}
                {currentQuestion.type === 'mcq' && currentQuestion.options && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {currentQuestion.options.map((opt, i) => {
                      const isSelected = currentAnswer === opt;
                      return (
                        <button
                          key={i}
                          onClick={() => selectAnswer(opt)}
                          style={{
                            minHeight: 100,
                            padding: '20px 24px',
                            borderRadius: 20,
                            border: isSelected ? `2px solid #E8B96C` : '2px solid rgba(255,255,255,0.1)',
                            background: isSelected ? 'rgba(232, 185, 108, 0.1)' : 'rgba(255,255,255,0.03)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 20,
                            textAlign: 'left',
                            transition: 'border-color 150ms, background 150ms',
                          }}
                        >
                          <span className="font-mono font-bold" style={{
                            width: 56, height: 56, borderRadius: 12,
                            background: isSelected ? '#E8B96C' : 'rgba(255,255,255,0.05)', 
                            color: isSelected ? '#120A08' : '#A8AEC9',
                            fontSize: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          }}>
                            {String.fromCharCode(65 + i)}
                          </span>
                          <span className="font-body" style={{ fontSize: 32, color: 'white', lineHeight: 1.4 }}>
                            {opt}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Open textarea */}
                {currentQuestion.type === 'open' && (
                  <div>
                    <textarea
                      ref={textareaRef}
                      value={currentAnswer}
                      onChange={e => selectAnswer(clampLength(e.target.value, INPUT_LIMITS.PRACTICE_OPEN_ANSWER))}
                      maxLength={INPUT_LIMITS.PRACTICE_OPEN_ANSWER}
                      placeholder="Type your answer here…"
                      rows={4}
                      style={{
                        width: '100%', padding: '24px 32px', borderRadius: 20,
                        border: '2px solid rgba(255,255,255,0.1)', fontSize: 32, lineHeight: 1.6,
                        fontFamily: 'Geist, sans-serif', resize: 'vertical', boxSizing: 'border-box',
                        outline: 'none', background: 'rgba(255,255,255,0.03)', color: 'white'
                      }}
                      onFocus={e => e.target.style.borderColor = '#E8B96C'}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                    />
                  </div>
                )}
              </div>

              {/* Navigation Footer */}
              <div style={{
                padding: '32px 48px',
                borderTop: '1px solid rgba(255,255,255,0.04)',
                background: 'rgba(0,0,0,0.2)',
                display: 'flex',
                gap: 24,
              }}>
                {currentIndex > 0 && (
                  <button
                    onClick={handlePrev}
                    style={{
                      flex: 1, height: 100, borderRadius: 24, border: '2px solid rgba(255,255,255,0.2)',
                      background: 'transparent', color: 'white',
                      fontSize: 32, fontFamily: 'Geist, sans-serif', fontWeight: 700,
                      cursor: 'pointer', transition: 'background 150ms'
                    }}
                  >
                    Previous
                  </button>
                )}
                <button
                  onClick={handleNext}
                  disabled={!currentAnswer.trim()}
                  style={{
                    flex: currentIndex > 0 ? 1 : '1 1 auto', width: currentIndex === 0 ? '100%' : 'auto',
                    height: 100, borderRadius: 24, border: 'none',
                    background: currentAnswer.trim() ? '#E8B96C' : 'rgba(255,255,255,0.04)',
                    color: currentAnswer.trim() ? '#120A08' : 'rgba(255,255,255,0.3)',
                    fontSize: 32, fontFamily: 'Geist, sans-serif', fontWeight: 700,
                    cursor: currentAnswer.trim() ? 'pointer' : 'not-allowed',
                    boxShadow: currentAnswer.trim() ? '0 8px 32px rgba(232,185,108,0.25), inset 0 2px 0 rgba(255,255,255,0.2)' : 'none',
                    transition: 'all 150ms ease'
                  }}
                >
                  {currentIndex < TOTAL_QUESTIONS - 1 ? 'Next →' : 'Submit'}
                </button>
              </div>
            </div>
          </div>
        )}

        {state === 'evaluating' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-8">
            <Spinner size="xl" color="#E8B96C" />
            <p className="font-display font-medium" style={{ fontSize: 42, color: 'var(--text-primary)' }}>
              Evaluating your session…
            </p>
            <p className="font-body" style={{ fontSize: 28, color: 'var(--text-secondary)' }}>
              The AI is reviewing all 5 of your answers.
            </p>
          </div>
        )}

        {/* Results */}
        {state === 'results' && (
          <SessionCompleteScreen
            skill="reading"
            exchangeCount={TOTAL_QUESTIONS}
            elapsedSeconds={elapsedSeconds}
            pointsAwarded={pointsAwarded ?? 0}
            updatedTotalPoints={updatedTotalPoints ?? student?.totalPoints ?? 0}
            studentFirstName={student?.name?.split(' ')[0] || 'there'}
            onPractiseAgain={() => router.push('/kiosk/practice')}
            onBackToMenu={() => router.push('/kiosk/menu')}
            evaluation={evaluation!}
            questionTexts={Object.fromEntries(questions.map(q => [q.id, q.question]))}
            studentAnswers={Object.fromEntries(questions.map((q, i) => [q.id, answers[i] || '']))}
          />
        )}
      </div>

      <EndSessionModal
        isOpen={showEndConfirm}
        onCancel={() => setShowEndConfirm(false)}
        onConfirm={confirmEnd}
        accentColor={accentColor}
      />
      </div>
    </div>
  )
}
