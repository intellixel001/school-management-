'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, ArrowLeft } from 'lucide-react'
import { Spinner, Badge } from '@/components/ui'
import { getStudentById, getRandomPracticePrompt } from '@/lib/services'
import { createPracticeSession } from '@/lib/services/practice'
import { SKILL_CONFIG } from '@/lib/skillConfig'
import { INPUT_LIMITS, clampLength } from '@/lib/security/inputLimits'
import { speakText, stopSpeaking } from '@/lib/speechUtils'
import type { Student, WritingPrompt, WritingTask } from '@/types/platform'
import type { EvaluateSessionResponse } from '@/app/api/evaluate-session/route'
import { useKioskSession } from '../../_components/KioskSessionProvider'

import SessionIntroScreen from '../[skill]/_components/SessionIntroScreen'
import SessionCompleteScreen from '../[skill]/_components/SessionCompleteScreen'
import EndSessionModal from '../_components/EndSessionModal'

type PracticeState = 'loading' | 'intro' | 'question' | 'evaluating' | 'results' | 'error'

const LEVEL_SHORT: Record<string, string> = {
  'entry-1': 'E1', 'entry-2': 'E2', 'entry-3': 'E3', 'level-1': 'L1',
}

const TOTAL_TASKS = 5

function generateUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

export default function KioskWritingPracticePage() {
  const router = useRouter()
  const { session: kioskSession, clear } = useKioskSession()

  const [state, setState] = useState<PracticeState>('loading')
  const [student, setStudent] = useState<Student | null>(null)
  const [writingPrompt, setWritingPrompt] = useState<WritingPrompt | null>(null)
  const [tasks, setTasks] = useState<WritingTask[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<string[]>(['', '', '', '', ''])
  const [draft, setDraft] = useState('')
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
        const p = await getRandomPracticePrompt(s.level, 'writing') as WritingPrompt
        const tasksArr = (p.tasks ?? []).slice(0, TOTAL_TASKS)
        // The writing session needs a non-empty `tasks[]` array (one per screen).
        // Legacy prompt records don't carry tasks — surface a clear message
        // rather than a blank canvas so students / staff know why.
        if (tasksArr.length === 0) {
          if (!cancelled) setState('error')
          return
        }
        if (!cancelled) {
          setStudent(s)
          setWritingPrompt(p)
          setTasks(tasksArr)
          setState('intro')
        }
      } catch { if (!cancelled) setState('error') }
    }
    load()
    return () => { cancelled = true }
  }, [kioskSession, router])

  // ─── AI tutor voice: intro-screen greeting ───────────────────────────────
  //
  // Guides the student through the intro card. Fires once per intro visit;
  // stops as soon as they hit Start Session or leave.
  useEffect(() => {
    if (state !== 'intro') return
    const line =
      "Let's start the writing practice. When you're done looking at the tasks, click on the Start Session button."
    const id = window.setTimeout(() => speakText(line), 500)
    return () => {
      window.clearTimeout(id)
      stopSpeaking()
    }
  }, [state])

  // ─── Timer ───────────────────────────────────────────────────────────────

  useEffect(() => {
    if (state === 'question' || state === 'evaluating') {
      timerRef.current = setInterval(() => setElapsedSeconds(p => p + 1), 1000)
    }
    return () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null } }
  }, [state])

  // ─── Autofocus on task change ──────────────────────────────

  useEffect(() => {
    if (state === 'question') {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
        setTimeout(() => textareaRef.current?.focus(), 50)
      }
    }
  }, [currentIndex, state])

  // ─── Auto-grow textarea ──────────────────────────────────────────────────

  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const el = e.target
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, window.innerHeight * 0.5)}px`
    // Clamp at WRITING_CANVAS — prevents paste-bombs from reaching LLM
    setDraft(clampLength(el.value, INPUT_LIMITS.WRITING_CANVAS))
  }, [])

  // ─── Evaluate session ────────────────────────────────────────────────────

  const evaluateSession = useCallback(async (allAnswers: string[]) => {
    if (!writingPrompt || !kioskSession) return
    setState('evaluating')
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }

    const payload = {
      skillArea: 'writing' as const,
      level: kioskSession.level,
      contentId: writingPrompt.id,
      contentText: writingPrompt.title,
      questions: tasks.map((t, i) => ({
        id: t.id,
        type: 'open' as const,
        question: t.instruction,
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

      const result = await createPracticeSession({
        studentId: kioskSession.studentId,
        skill: 'writing',
        level: kioskSession.level,
        correctCount: data.correctCount,
        totalQuestions: TOTAL_TASKS,
        durationSec: elapsedSeconds,
      })
      setPointsAwarded(result.pointsAwarded)
      setUpdatedTotalPoints(result.student.totalPoints)
      setState('results')
    } catch (err) {
      console.error('[Writing] evaluateSession failed', err)
      setEvaluation({
        overallScore: 0, correctCount: 0,
        perQuestion: tasks.map(t => ({ questionId: t.id, isCorrect: false, feedback: 'Could not evaluate — please try again later.' })),
        overallFeedback: 'We were unable to evaluate this session. Your answers were recorded but no points were awarded.',
      })
      setState('results')
    }
  }, [writingPrompt, kioskSession, tasks, elapsedSeconds, sessionId])

  // ─── Handle answer ────────────────────────────────────────────────────────

  const handleNext = useCallback(() => {
    const answer = clampLength(draft.trim(), INPUT_LIMITS.WRITING_CANVAS)
    const next = [...answers]
    next[currentIndex] = answer
    setAnswers(next)
    if (currentIndex < TOTAL_TASKS - 1) {
      setCurrentIndex(i => i + 1)
      setDraft(next[currentIndex + 1] || '')
    } else {
      evaluateSession(next)
    }
  }, [answers, currentIndex, draft, evaluateSession])

  const handlePrevious = useCallback(() => {
    // Save current draft before moving back
    const answer = clampLength(draft.trim(), INPUT_LIMITS.WRITING_CANVAS)
    const next = [...answers]
    next[currentIndex] = answer
    setAnswers(next)
    
    if (currentIndex > 0) {
      setCurrentIndex(i => i - 1)
      setDraft(next[currentIndex - 1] || '')
    }
  }, [answers, currentIndex, draft])

  const [showEndConfirm, setShowEndConfirm] = useState(false)
  const handleEnd = useCallback(() => { setShowEndConfirm(true) }, [])
  const confirmEnd = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    setShowEndConfirm(false)
    router.push('/kiosk/practice')
  }, [router])

  // ─── Helpers ─────────────────────────────────────────────────────────────

  const formatTimer = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`
  const skillConfig = SKILL_CONFIG['writing']
  const SkillIcon = skillConfig.icon
  const accentColor = '#E8B96C' // Premium golden accent
  const currentTask = tasks[currentIndex]
  const wordCount = countWords(draft)
  const minWords = currentTask?.minWords ?? 1
  const canSubmit = wordCount >= minWords
  const progressPct = ((currentIndex) / TOTAL_TASKS) * 100 + (1 / TOTAL_TASKS) * 100

  if (state === 'loading') return <div className="flex items-center justify-center w-full h-full"><Spinner size="lg" /></div>
  if (state === 'error') return (
    <div
      className="flex flex-col items-center justify-center w-full h-full gap-6 px-8 text-center"
      style={{ background: '#F5F5F2', color: '#1A1A1A' }}
    >
      <div style={{ fontSize: 72, color: '#F59E0B' }}>⚠</div>
      <h2 className="font-display font-semibold" style={{ fontSize: 44, color: '#1A1A1A' }}>
        No writing practice available yet
      </h2>
      <p className="font-body" style={{ fontSize: 24, color: '#555', maxWidth: 640, lineHeight: 1.5 }}>
        Writing practice content for your level is being prepared. Please try another skill or ask your teacher.
      </p>
      <button
        onClick={() => router.push('/kiosk/practice')}
        style={{
          marginTop: 16, padding: '16px 40px', borderRadius: 16,
          background: '#4F46E5', color: '#fff', border: 'none',
          fontSize: 24, fontWeight: 600, cursor: 'pointer',
        }}
      >
        Back to practice menu
      </button>
    </div>
  )

  return (
    <div data-theme="dark" className="relative flex flex-col w-screen h-[100dvh] bg-[var(--bg-base)] overflow-hidden">
      <div className="relative z-10 flex flex-col w-full h-full">
        {/* Header */}
        <header className="relative flex items-center justify-center shrink-0 px-8 py-4 z-10" style={{ minHeight: 120 }}>
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
              background: 'rgba(239, 68, 68, 0.1)',
              borderColor: 'rgba(239, 68, 68, 0.3)',
              color: '#FCA5A5'
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
        {state === 'intro' && student && writingPrompt && (
          <SessionIntroScreen
            skill="writing"
            levelShort={LEVEL_SHORT[student.level]}
            content={writingPrompt}
            onStart={() => setState('question')}
          />
        )}

        {/* Question */}
        {state === 'question' && currentTask && (
          <div className="flex-1 flex flex-col overflow-auto" style={{ padding: '64px 0' }}>
            <div style={{ width: '100%', maxWidth: 900, margin: '0 auto', padding: '0 32px', display: 'flex', flexDirection: 'column', gap: 32 }}>
              
              <div style={{
                background: 'rgba(255,255,255,0.02)',
                borderRadius: '32px',
                padding: '48px',
                border: '1px solid rgba(255,255,255,0.06)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
                display: 'flex',
                flexDirection: 'column',
                gap: 32
              }}>
                {/* Progress */}
                <div>
                  <div className="flex items-baseline justify-between mb-4">
                    <span className="font-mono font-bold uppercase tracking-widest" style={{ fontSize: 20, color: accentColor }}>
                      Task {currentIndex + 1} of {TOTAL_TASKS}
                    </span>
                    {writingPrompt && (
                      <span className="font-body text-[var(--text-secondary)]" style={{ fontSize: 24 }}>{writingPrompt.title}</span>
                    )}
                  </div>
                  <div style={{ height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: accentColor, width: `${progressPct}%`, borderRadius: 4, transition: 'width 200ms ease' }} />
                  </div>
                </div>

                {/* Task instruction */}
                <div>
                  <h1 className="font-display font-semibold" style={{ fontSize: 36, color: 'var(--text-primary)', lineHeight: 1.4, margin: 0 }}>
                    {currentTask.instruction}
                  </h1>
                  {currentTask.hint && (
                    <p className="font-body" style={{ fontSize: 24, color: 'var(--text-muted)', marginTop: 12 }}>
                      💡 {currentTask.hint}
                    </p>
                  )}
                </div>

                {/* Writing canvas */}
                <textarea
                  ref={textareaRef}
                  value={draft}
                  onChange={handleTextareaChange}
                  placeholder="Type your response here…"
                  style={{
                    width: '100%', minHeight: 400, maxHeight: '50vh',
                    padding: 32, fontFamily: 'Geist, sans-serif', fontSize: 32, fontWeight: 400,
                    lineHeight: 1.6, color: 'var(--text-primary)',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24,
                    background: 'rgba(0,0,0,0.2)', outline: 'none', resize: 'none', boxSizing: 'border-box',
                    transition: 'border-color 200ms, box-shadow 200ms',
                    boxShadow: 'inset 0 4px 16px rgba(0,0,0,0.2)'
                  }}
                  maxLength={INPUT_LIMITS.WRITING_CANVAS}
                  onFocus={e => {
                    e.target.style.borderColor = accentColor
                    e.target.style.boxShadow = `0 0 0 2px rgba(232, 185, 108, 0.2), inset 0 4px 16px rgba(0,0,0,0.2)`
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = 'rgba(255,255,255,0.1)'
                    e.target.style.boxShadow = 'inset 0 4px 16px rgba(0,0,0,0.2)'
                  }}
                />

                {/* Inline controls */}
                <div className="flex items-center justify-between" style={{ marginTop: 8 }}>
                  <span className="font-mono" style={{ fontSize: 22, color: 'var(--text-muted)' }}>
                    <span style={{ color: canSubmit ? accentColor : 'var(--text-muted)' }}>
                      {canSubmit && '✓ '}
                      {wordCount} word{wordCount !== 1 ? 's' : ''}
                    </span>
                    {minWords > 1 && <span style={{ color: 'rgba(255,255,255,0.2)' }}> · min {minWords}</span>}
                  </span>
                  
                  <div className="flex gap-4">
                    {currentIndex > 0 && (
                      <button
                        onClick={handlePrevious}
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          color: 'var(--text-primary)',
                          border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '0 40px', height: 68,
                          fontSize: 26, fontFamily: 'Geist, sans-serif', fontWeight: 600,
                          cursor: 'pointer', transition: 'background 200ms',
                        }}
                      >
                        Previous
                      </button>
                    )}
                    <button
                      onClick={handleNext}
                      disabled={!canSubmit}
                      style={{
                        background: canSubmit ? '#E8B96C' : 'rgba(255,255,255,0.05)',
                        color: canSubmit ? '#120A08' : 'rgba(255,255,255,0.2)',
                        border: 'none', borderRadius: 20, padding: '0 40px', height: 68,
                        fontSize: 26, fontFamily: 'Geist, sans-serif', fontWeight: 600,
                        cursor: canSubmit ? 'pointer' : 'not-allowed', transition: 'background 200ms',
                        boxShadow: canSubmit ? '0 4px 16px rgba(232, 185, 108, 0.2), inset 0 2px 0 rgba(255,255,255,0.2)' : 'none'
                      }}
                    >
                      {currentIndex < TOTAL_TASKS - 1 ? 'Next' : 'Finish'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {state === 'evaluating' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-8">
            <Spinner size="xl" color="#E8B96C" />
            <p className="font-display font-medium text-[var(--text-primary)]" style={{ fontSize: 42 }}>
              Evaluating your session…
            </p>
            <p className="font-body text-[var(--text-secondary)]" style={{ fontSize: 28 }}>
              The AI is reviewing all 5 of your writing tasks.
            </p>
          </div>
        )}

        {/* Results */}
        {state === 'results' && (
          <SessionCompleteScreen
            skill="writing"
            exchangeCount={TOTAL_TASKS}
            elapsedSeconds={elapsedSeconds}
            pointsAwarded={pointsAwarded}
            updatedTotalPoints={updatedTotalPoints}
            studentFirstName={kioskSession?.studentName?.split(' ')[0] || 'there'}
            onPractiseAgain={() => router.push('/kiosk/practice')}
            onBackToMenu={() => router.push('/kiosk/menu')}
            evaluation={evaluation}
            questionTexts={Object.fromEntries(tasks.map(t => [t.id, t.instruction]))}
            studentAnswers={Object.fromEntries(tasks.map((t, i) => [t.id, answers[i] || '']))}
          />
        )}
      </div>
      
      </div>

      <EndSessionModal
        isOpen={showEndConfirm}
        onCancel={() => setShowEndConfirm(false)}
        onConfirm={confirmEnd}
        accentColor={accentColor}
      />
    </div>
  )
}
