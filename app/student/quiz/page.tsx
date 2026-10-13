'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { Question } from '@/types/platform'
import { getQuestionsForQuiz, recordQuizResult } from '@/lib/services'
import { Skeleton } from '@/components/ui/primitives/Skeleton'
import { QuizSetup }     from './_components/QuizSetup'
import { QuizQuestion }  from './_components/QuizQuestion'
import { QuizResults }   from './_components/QuizResults'
import { useStudentSession } from '../_components/StudentSessionProvider'

// ── Constants ─────────────────────────────────────────────────────────────────

const QUIZ_QUESTION_COUNT = 5
const POINTS_PER_CORRECT = 1
const MAX_POINTS_PER_SESSION = 5
const REVEAL_DELAY = 1500          // ms before auto-advance after answer

// ── UUID helper ───────────────────────────────────────────────────────────────

function generateUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

// ── Types ─────────────────────────────────────────────────────────────────────

type QuizStage = 'setup' | 'quiz' | 'results'

interface QuizAnswerRecord {
  questionText: string
  isCorrect: boolean
  pointsEarned: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Pick quiz-eligible questions via service */
async function pickQuestions(count: number): Promise<Question[]> {
  return getQuestionsForQuiz(count)
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function QuizPage() {
  // ── Stage machine ──────────────────────────────────────────────────────────
  const [stage, setStage] = useState<QuizStage>('setup')

  // ── Quiz state ─────────────────────────────────────────────────────────────
  const [questions, setQuestions]         = useState<Question[]>([])
  const [currentIndex, setCurrentIndex]   = useState(0)
  const [score, setScore]                 = useState(0)
  const [answers, setAnswers]             = useState<QuizAnswerRecord[]>([])

  // ── Points state (set after quiz completes and service responds) ───────────
  const [pointsAwarded, setPointsAwarded]           = useState<number | null>(null)
  const [updatedTotalPoints, setUpdatedTotalPoints] = useState<number | null>(null)

  // ── Per-question reveal state ──────────────────────────────────────────────
  const [isRevealing, setIsRevealing]         = useState(false)
  const [submittedAnswer, setSubmittedAnswer]   = useState<string | null>(null)

  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Generated once per quiz start — used for backend idempotency key
  const quizSessionIdRef = useRef<string>('')

  // Student session from Phase 10c
  const { session: studentSession } = useStudentSession()

  // Clear any pending reveal timer on unmount
  useEffect(() => {
    return () => {
      if (revealTimerRef.current) clearTimeout(revealTimerRef.current)
    }
  }, [])

  const currentQuestion = questions[currentIndex] ?? null

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleStart = useCallback(async () => {
    const picked = await pickQuestions(QUIZ_QUESTION_COUNT)
    // Generate session ID at quiz start (not on every render)
    quizSessionIdRef.current = generateUuid()
    setQuestions(picked)
    setCurrentIndex(0)
    setScore(0)
    setAnswers([])
    setIsRevealing(false)
    setSubmittedAnswer(null)
    setPointsAwarded(null)
    setUpdatedTotalPoints(null)
    setStage('quiz')
  }, [])

  const handleAnswer = useCallback((answer: string | null, _timeRemaining: number) => {
    if (!currentQuestion) return

    const isCorrect = answer !== null &&
      answer.toLowerCase().trim() === currentQuestion.correctAnswer.toLowerCase().trim()

    // Unified: 1 point per correct answer, 0 for wrong/timeout. No speed bonus.
    const points = isCorrect ? POINTS_PER_CORRECT : 0

    setSubmittedAnswer(answer)
    setIsRevealing(true)
    if (points > 0) setScore(prev => prev + points)

    setAnswers(prev => [
      ...prev,
      {
        questionText: currentQuestion.questionText,
        isCorrect,
        pointsEarned: points,
      },
    ])

    // Auto-advance after REVEAL_DELAY
    revealTimerRef.current = setTimeout(() => {
      setIsRevealing(false)
      setSubmittedAnswer(null)
      const nextIndex = currentIndex + 1
      if (nextIndex >= questions.length) {
        // We'll let the useEffect below handle stage transition + service call
        setStage('results')
      } else {
        setCurrentIndex(nextIndex)
      }
    }, REVEAL_DELAY)
  }, [currentQuestion, currentIndex, questions.length])

  // Submit quiz result when stage transitions to 'results'
  useEffect(() => {
    if (stage !== 'results' || answers.length === 0) return

    const correctCount = answers.filter(a => a.isCorrect).length

    if (!studentSession) {
      // No session — guard should prevent this but be defensive
      return
    }

    const durationSec = 0 // Phase 10d: no quiz-level timer tracked; backend can add later
    ;(async () => {
      try {
        const result = await recordQuizResult({
          studentId: studentSession.studentId,
          correctCount,
          totalCount: answers.length,
          sessionId: quizSessionIdRef.current,
          durationSec,
        })
        setPointsAwarded(result.pointsAwarded)
        setUpdatedTotalPoints(result.student.totalPoints)
      } catch {
        console.warn('[Phase 10d] recordQuizResult failed')
        setPointsAwarded(null)
      }
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]) // intentionally only re-run when stage changes to 'results'

  const handlePlayAgain = useCallback(() => {
    setStage('setup')
    setCurrentIndex(0)
    setScore(0)
    setAnswers([])
    setIsRevealing(false)
    setSubmittedAnswer(null)
    setQuestions([])
    setPointsAwarded(null)
    setUpdatedTotalPoints(null)
  }, [])

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ width: '100%', maxWidth: 680, margin: '0 auto' }}>

      {/* Page header — only shown on quiz + results stages */}
      {stage !== 'setup' && (
        <div style={{ marginBottom: 22, animation: 'fadeSlideUp 250ms ease-out both' }}>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800,
            color: '#0F172A', margin: 0,
          }}>
            {stage === 'quiz' ? 'Quick Quiz' : 'Quiz Complete'}
          </h1>
          <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 4, marginBottom: 0 }}>
            {stage === 'quiz'
              ? 'Answer correctly to earn points'
              : 'Here\'s how you did'}
          </p>
        </div>
      )}

      {/* ── STAGE: Setup ──────────────────────────────────────────────────── */}
      {stage === 'setup' && (
        <QuizSetup onStart={handleStart} />
      )}

      {/* ── STAGE: Quiz ───────────────────────────────────────────────────── */}
      {stage === 'quiz' && currentQuestion && (
        <QuizQuestion
          key={`${currentQuestion.id}-${currentIndex}`}
          question={currentQuestion}
          questionNumber={currentIndex + 1}
          totalQuestions={questions.length}
          score={score}
          onAnswer={handleAnswer}
          isRevealing={isRevealing}
          submittedAnswer={submittedAnswer}
          correctAnswer={currentQuestion.correctAnswer}
        />
      )}

      {/* ── STAGE: Results ────────────────────────────────────────────────── */}
      {stage === 'results' && (
        <QuizResults
          score={score}
          answers={answers}
          pointsAwarded={pointsAwarded}
          updatedTotalPoints={updatedTotalPoints}
          onPlayAgain={handlePlayAgain}
        />
      )}
    </div>
  )
}
