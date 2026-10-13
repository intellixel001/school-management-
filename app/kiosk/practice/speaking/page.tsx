'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Mic, Square, Pencil, Check, ArrowLeft } from 'lucide-react'
import { Spinner, Badge } from '@/components/ui'
import { getStudentById, getRandomPracticePrompt } from '@/lib/services'
import { createPracticeSession } from '@/lib/services/practice'
import { SKILL_CONFIG } from '@/lib/skillConfig'
import { INPUT_LIMITS, clampLength } from '@/lib/security/inputLimits'
import { startPTTRecording, stopPTTRecording, speakText, stopSpeaking } from '@/lib/speechUtils'
import type { Student, SpeakingTopic, SpeakingTask } from '@/types/platform'
import type { EvaluateSessionResponse } from '@/app/api/evaluate-session/route'
import { useKioskSession } from '../../_components/KioskSessionProvider'

import SessionIntroScreen from '../[skill]/_components/SessionIntroScreen'
import SessionCompleteScreen from '../[skill]/_components/SessionCompleteScreen'
import EndSessionModal from '../_components/EndSessionModal'

type PracticeState = 'loading' | 'intro' | 'question' | 'evaluating' | 'results' | 'error'
type MicPhase = 'idle' | 'recording' | 'review'

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

export default function KioskSpeakingPracticePage() {
  const router = useRouter()
  const { session: kioskSession, clear } = useKioskSession()

  const [state, setState] = useState<PracticeState>('loading')
  const [micPhase, setMicPhase] = useState<MicPhase>('idle')
  const [student, setStudent] = useState<Student | null>(null)
  const [topic, setTopic] = useState<SpeakingTopic | null>(null)
  const [tasks, setTasks] = useState<SpeakingTask[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  // answers[i] = transcribed text for task i
  const [answers, setAnswers] = useState<string[]>(['', '', '', '', ''])
  const [transcript, setTranscript] = useState('')
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [toastMessage, setToastMessage] = useState('')
  // Transcription is often wrong on accents or captures filler words ("uhm", "ah").
  // The pencil icon on the review card flips this flag so the student can fix it
  // before submitting — the corrected text becomes the answer sent for evaluation.
  const [isEditingTranscript, setIsEditingTranscript] = useState(false)
  const [evaluation, setEvaluation] = useState<EvaluateSessionResponse | null>(null)
  const [pointsAwarded, setPointsAwarded] = useState<number | null>(null)
  const [updatedTotalPoints, setUpdatedTotalPoints] = useState<number | null>(null)
  const [sessionId] = useState(generateUuid)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ─── Load ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!kioskSession) { router.replace('/kiosk'); return }
    let cancelled = false
    async function load() {
      try {
        const s = await getStudentById(kioskSession!.studentId)
        if (cancelled || !s) { if (!cancelled) setState('error'); return }
        const t = await getRandomPracticePrompt(s.level, 'speaking') as SpeakingTopic
        const tasksArr = (t.tasks ?? []).slice(0, TOTAL_TASKS)
        // Same story as writing: legacy topic records without a `tasks[]` array
        // would render a blank canvas. Show a real message instead.
        if (tasksArr.length === 0) {
          if (!cancelled) setState('error')
          return
        }
        if (!cancelled) {
          setStudent(s)
          setTopic(t)
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
  // stops when they hit Start Session (state → question) or leave.
  useEffect(() => {
    if (state !== 'intro') return
    const line =
      "Tap the microphone or hold the spacebar to speak clearly. The AI tutor will listen and give you feedback on your response. Click on the Start Session button when you're ready."
    const id = window.setTimeout(() => speakText(line), 500)
    return () => {
      window.clearTimeout(id)
      stopSpeaking()
    }
  }, [state])

  // ─── Session timer ────────────────────────────────────────────────────────

  useEffect(() => {
    if (state === 'question' || state === 'evaluating') {
      timerRef.current = setInterval(() => setElapsedSeconds(p => p + 1), 1000)
    }
    return () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null } }
  }, [state])

  // ─── Recording timer ──────────────────────────────────────────────────────

  useEffect(() => {
    if (micPhase === 'recording') {
      setRecordingSeconds(0)
      recordingTimerRef.current = setInterval(() => setRecordingSeconds(p => p + 1), 1000)
    } else {
      if (recordingTimerRef.current) { clearInterval(recordingTimerRef.current); recordingTimerRef.current = null }
    }
    return () => { if (recordingTimerRef.current) { clearInterval(recordingTimerRef.current); recordingTimerRef.current = null } }
  }, [micPhase])

  // ─── Reset mic state on task change ──────────────────────────────────────

  useEffect(() => {
    if (state === 'question') {
      setMicPhase('idle')
      setTranscript('')
    }
  }, [currentIndex, state])

  useEffect(() => {
    return () => { stopPTTRecording().catch(() => {}) }
  }, [])

  // ─── Toast helper ─────────────────────────────────────────────────────────

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 3500)
  }, [])

  // ─── PTT handlers ─────────────────────────────────────────────────────────

  const handleMicStart = useCallback(async () => {
    try {
      setMicPhase('recording')
      await startPTTRecording()
    } catch {
      setMicPhase('idle')
      showToast('Microphone access required. Please allow and try again.')
    }
  }, [showToast])

  const handleMicStop = useCallback(async () => {
    setMicPhase('idle') // transitional
    try {
      const text = await stopPTTRecording()
      if (!text || text.trim().length === 0) {
        showToast("Couldn't hear you clearly. Please try again.")
        setMicPhase('idle')
        return
      }
      setTranscript(clampLength(text, INPUT_LIMITS.SPEAKING_TRANSCRIPT))
      setMicPhase('review')
    } catch {
      showToast('Recording failed. Please try again.')
      setMicPhase('idle')
    }
  }, [showToast])

  const handleReRecord = useCallback(() => {
    setTranscript('')
    setMicPhase('idle')
    setIsEditingTranscript(false)
  }, [])

  // ─── Push-to-talk via spacebar ───────────────────────────────────────────
  // Hold Space to record, release to stop. Only active on the question screen.
  // Guards: ignore key auto-repeat, ignore when typing in an input, allow tap
  // behaviour to keep working on the mic button.
  useEffect(() => {
    if (state !== 'question') return

    function isEditableTarget(t: EventTarget | null): boolean {
      if (!(t instanceof HTMLElement)) return false
      const tag = t.tagName
      return tag === 'INPUT' || tag === 'TEXTAREA' || t.isContentEditable
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.code !== 'Space' || e.repeat) return
      if (isEditableTarget(e.target)) return
      if (micPhase !== 'idle') return
      e.preventDefault()
      void handleMicStart()
    }

    function handleKeyUp(e: KeyboardEvent) {
      if (e.code !== 'Space') return
      if (isEditableTarget(e.target)) return
      if (micPhase !== 'recording') return
      e.preventDefault()
      void handleMicStop()
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [state, micPhase, handleMicStart, handleMicStop])

  // ─── Evaluate session ────────────────────────────────────────────────────

  const evaluateSession = useCallback(async (allAnswers: string[]) => {
    if (!topic || !kioskSession) return
    setState('evaluating')
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }

    const payload = {
      skillArea: 'speaking' as const,
      level: kioskSession.level,
      contentId: topic.id,
      contentText: topic.title,
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
        skill: 'speaking',
        level: kioskSession.level,
        correctCount: data.correctCount,
        totalQuestions: TOTAL_TASKS,
        durationSec: elapsedSeconds,
      })
      setPointsAwarded(result.pointsAwarded)
      setUpdatedTotalPoints(result.student.totalPoints)
      setState('results')
    } catch (err) {
      console.error('[Speaking] evaluateSession failed', err)
      setEvaluation({
        overallScore: 0, correctCount: 0,
        perQuestion: tasks.map(t => ({ questionId: t.id, isCorrect: false, feedback: 'Could not evaluate — please try again later.' })),
        overallFeedback: 'We were unable to evaluate this session. Your answers were recorded but no points were awarded.',
      })
      setState('results')
    }
  }, [topic, kioskSession, tasks, elapsedSeconds, sessionId])

  // ─── Advance to next task / finish ───────────────────────────────────────

  const handleNext = useCallback(() => {
    // Transcript (possibly edited by the student) becomes the answer for this task
    const next = [...answers]
    next[currentIndex] = clampLength(transcript, INPUT_LIMITS.SPEAKING_TRANSCRIPT)
    setAnswers(next)
    setIsEditingTranscript(false)

    if (currentIndex < TOTAL_TASKS - 1) {
      setCurrentIndex(i => i + 1)
      setTranscript(next[currentIndex + 1] || '')
    } else {
      evaluateSession(next)
    }
  }, [answers, currentIndex, transcript, evaluateSession])

  const handlePrevious = useCallback(() => {
    const next = [...answers]
    next[currentIndex] = clampLength(transcript, INPUT_LIMITS.SPEAKING_TRANSCRIPT)
    setAnswers(next)
    setIsEditingTranscript(false)

    if (currentIndex > 0) {
      setCurrentIndex(i => i - 1)
      setTranscript(next[currentIndex - 1] || '')
    }
  }, [answers, currentIndex, transcript])

  const [showEndConfirm, setShowEndConfirm] = useState(false)
  const handleEnd = useCallback(() => { setShowEndConfirm(true) }, [])
  const confirmEnd = useCallback(() => {
    stopPTTRecording().catch(() => {})
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    setShowEndConfirm(false)
    router.push('/kiosk/practice')
  }, [router])

  // ─── Helpers ─────────────────────────────────────────────────────────────

  const formatTimer = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`
  const skillConfig = SKILL_CONFIG['speaking']
  const SkillIcon = skillConfig.icon
  const accentColor = '#E8B96C' // Premium golden accent
  const currentTask: SpeakingTask | undefined = tasks[currentIndex]
  const progressPct = ((currentIndex) / TOTAL_TASKS) * 100 + (1 / TOTAL_TASKS) * 100

  if (state === 'loading') return <div className="flex items-center justify-center w-full h-full"><Spinner size="lg" /></div>
  if (state === 'error') return (
    <div
      className="flex flex-col items-center justify-center w-full h-full gap-6 px-8 text-center"
      style={{ background: '#F5F5F2', color: '#1A1A1A' }}
    >
      <div style={{ fontSize: 72, color: '#F59E0B' }}>⚠</div>
      <h2 className="font-display font-semibold" style={{ fontSize: 44, color: '#1A1A1A' }}>
        No speaking practice available yet
      </h2>
      <p className="font-body" style={{ fontSize: 24, color: '#555', maxWidth: 640, lineHeight: 1.5 }}>
        Speaking practice content for your level is being prepared. Please try another skill or ask your teacher.
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

      {/* Toast */}
      {toastMessage && (
        <div style={{
          position: 'fixed', bottom: 120, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)', padding: '24px 32px', borderRadius: 16,
          fontSize: 24, fontFamily: 'Geist, sans-serif', zIndex: 100, boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          backdropFilter: 'blur(16px)'
        }}>
          {toastMessage}
        </div>
      )}

      <div className="flex-1 flex flex-col" style={{ minHeight: 0, overflow: 'hidden' }}>
        {/* Intro */}
        {state === 'intro' && student && topic && (
          <SessionIntroScreen
            skill="speaking"
            levelShort={LEVEL_SHORT[student.level]}
            content={topic}
            onStart={() => setState('question')}
          />
        )}

        {state === 'question' && currentTask && (
          <div className="flex-1 flex flex-col overflow-auto" style={{ padding: '64px 0' }}>
            <div style={{ 
              width: '100%', maxWidth: 900, margin: '0 auto', 
              background: 'rgba(255,255,255,0.02)', borderRadius: '32px', padding: '48px',
              border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
              display: 'flex', flexDirection: 'column', gap: 32 
            }}>
              {/* Progress */}
              <div>
                <div className="flex items-baseline justify-between mb-4">
                  <span className="font-mono font-bold uppercase tracking-widest" style={{ fontSize: 20, color: accentColor }}>
                    Task {currentIndex + 1} of {TOTAL_TASKS}
                  </span>
                  {topic && <span className="font-body text-[var(--text-secondary)]" style={{ fontSize: 24 }}>{topic.title}</span>}
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
                    <span style={{ color: accentColor }}>💡</span> {currentTask.hint}
                  </p>
                )}
                {currentTask.expectedDurationSec && (
                  <p className="font-mono" style={{ fontSize: 20, color: 'var(--text-muted)', marginTop: 8 }}>
                    Expected: ~{currentTask.expectedDurationSec}s
                  </p>
                )}
              </div>

              {/* Mic area */}
              <div className="flex flex-col items-center" style={{ paddingTop: 40, paddingBottom: 24, gap: 32 }}>
                {(micPhase === 'idle' || micPhase === 'recording') && (
                  <>
                    <div className="relative flex items-center justify-center">
                      {micPhase === 'recording' && (
                        <>
                          <style>{`
                            @keyframes pulse-ring {
                              0% { transform: scale(1); opacity: 0.5; }
                              100% { transform: scale(1.6); opacity: 0; }
                            }
                          `}</style>
                          <div style={{ position: 'absolute', width: 240, height: 240, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.4)', animation: 'pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite' }} />
                          <div style={{ position: 'absolute', width: 240, height: 240, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.4)', animation: 'pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite 1s' }} />
                        </>
                      )}
                      <button
                        id={`mic-btn-task-${currentIndex}`}
                        onClick={micPhase === 'idle' ? handleMicStart : handleMicStop}
                        style={{
                          position: 'relative', zIndex: 10,
                          width: 240, height: 240, borderRadius: '50%',
                          background: micPhase === 'recording' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(232, 185, 108, 0.08)',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: micPhase === 'recording'
                            ? '0 0 60px rgba(239, 68, 68, 0.3), inset 0 2px 20px rgba(255,255,255,0.1)'
                            : '0 0 40px rgba(232, 185, 108, 0.15), inset 0 2px 20px rgba(255,255,255,0.05)',
                          border: micPhase === 'recording' ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(232, 185, 108, 0.25)',
                          transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                        onPointerDown={(e) => { e.currentTarget.style.transform = 'scale(0.95)' }}
                        onPointerUp={(e)   => { e.currentTarget.style.transform = 'scale(1)' }}
                        onPointerLeave={(e)=> { e.currentTarget.style.transform = 'scale(1)' }}
                      >
                        {micPhase === 'recording'
                          ? <Square size={80} color="#FCA5A5" fill="#FCA5A5" />
                          : <Mic size={96} color="#E8B96C" />
                        }
                      </button>
                    </div>

                    {micPhase === 'idle' && (
                      <p className="font-body text-center" style={{ fontSize: 28, color: 'var(--text-secondary)' }}>
                        Tap or hold <kbd style={{
                          display: 'inline-block',
                          padding: '2px 10px',
                          borderRadius: 6,
                          border: '1px solid rgba(232, 185, 108, 0.35)',
                          background: 'rgba(232, 185, 108, 0.10)',
                          color: '#E8B96C',
                          fontFamily: 'monospace',
                          fontSize: 22,
                          fontWeight: 700,
                          margin: '0 4px',
                        }}>Space</kbd> to speak
                      </p>
                    )}
                    {micPhase === 'recording' && (
                      <div className="flex flex-col items-center gap-2">
                        <style>{`@keyframes mic-pulse { 0%,100%{opacity:1}50%{opacity:0.6} } .mic-pulse{animation:mic-pulse 1s ease-in-out infinite}`}</style>
                        <p className="font-body mic-pulse text-center" style={{ fontSize: 28, color: '#FCA5A5', fontWeight: 600 }}>
                          Tap or release <kbd style={{
                            display: 'inline-block',
                            padding: '2px 10px',
                            borderRadius: 6,
                            border: '1px solid rgba(252, 165, 165, 0.4)',
                            background: 'rgba(252, 165, 165, 0.10)',
                            color: '#FCA5A5',
                            fontFamily: 'monospace',
                            fontSize: 22,
                            fontWeight: 700,
                            margin: '0 4px',
                          }}>Space</kbd> to stop · Listening…
                        </p>
                        <span className="font-mono" style={{ fontSize: 24, color: 'var(--text-muted)' }}>
                          {formatTimer(recordingSeconds)}
                        </span>
                      </div>
                    )}
                  </>
                )}

                {/* Review: transcript card */}
                {micPhase === 'review' && (
                  <div style={{
                    width: '100%', padding: '32px 48px',
                    background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: 'inset 0 4px 16px rgba(0,0,0,0.2)',
                    borderRadius: 24, position: 'relative',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                      <span className="font-mono font-bold uppercase" style={{ fontSize: 20, letterSpacing: '0.08em', color: accentColor }}>
                        Your Answer
                      </span>
                      <button
                        onClick={() => setIsEditingTranscript(v => !v)}
                        aria-label={isEditingTranscript ? 'Save changes' : 'Edit your answer'}
                        style={{
                          width: 48, height: 48, borderRadius: 12,
                          background: 'rgba(255,255,255,0.1)', color: 'var(--text-primary)',
                          border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'transform 120ms ease, background 200ms',
                        }}
                        onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.94)' }}
                        onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
                      >
                        {isEditingTranscript ? <Check size={22} strokeWidth={2.5} color="#E8B96C" /> : <Pencil size={20} strokeWidth={2.4} />}
                      </button>
                    </div>

                    {isEditingTranscript ? (
                      <textarea
                        value={transcript}
                        onChange={e => setTranscript(clampLength(e.target.value, INPUT_LIMITS.SPEAKING_TRANSCRIPT))}
                        autoFocus
                        rows={3}
                        style={{
                          width: '100%', marginTop: 12, padding: '20px 24px',
                          borderRadius: 16, border: `1px solid ${accentColor}`,
                          fontFamily: 'Geist, sans-serif', fontSize: 30, lineHeight: 1.6,
                          color: 'var(--text-primary)', background: 'rgba(0,0,0,0.4)', outline: 'none',
                          resize: 'vertical', boxSizing: 'border-box',
                          boxShadow: `0 0 0 2px rgba(232, 185, 108, 0.2), inset 0 4px 16px rgba(0,0,0,0.4)`
                        }}
                        maxLength={INPUT_LIMITS.SPEAKING_TRANSCRIPT}
                      />
                    ) : (
                      <p className="font-body" style={{ fontSize: 32, color: 'var(--text-primary)', lineHeight: 1.6, marginTop: 12 }}>
                        {transcript}
                      </p>
                    )}

                    <div className="flex items-center justify-between" style={{ marginTop: 24 }}>
                      <button
                        onClick={handleReRecord}
                        style={{
                          border: '1px solid rgba(255,255,255,0.15)', borderRadius: 20,
                          padding: '0 32px', height: 60,
                          fontSize: 22, fontFamily: 'Geist, sans-serif', fontWeight: 600,
                          background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', cursor: 'pointer',
                          transition: 'background 200ms',
                        }}
                      >
                        Re-record
                      </button>
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
                          style={{
                            background: accentColor, color: '#120A08', border: 'none',
                            borderRadius: 20, padding: '0 40px', height: 68,
                            fontSize: 26, fontFamily: 'Geist, sans-serif', fontWeight: 600,
                            cursor: 'pointer', transition: 'background 200ms',
                            boxShadow: '0 4px 16px rgba(232, 185, 108, 0.2), inset 0 2px 0 rgba(255,255,255,0.2)'
                          }}
                        >
                          {currentIndex < TOTAL_TASKS - 1 ? 'Next' : 'Finish'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
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
              The AI is reviewing all 5 of your spoken responses.
            </p>
          </div>
        )}

        {/* Results */}
        {state === 'results' && (
          <SessionCompleteScreen
            skill="speaking"
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
