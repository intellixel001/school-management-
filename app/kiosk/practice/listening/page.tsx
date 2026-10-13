'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Play, RotateCcw, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react'
import { Spinner, Badge } from '@/components/ui'
import { getStudentById, getRandomPracticePassage } from '@/lib/services'
import { createPracticeSession } from '@/lib/services/practice'
import { SKILL_CONFIG } from '@/lib/skillConfig'
import { INPUT_LIMITS, clampLength } from '@/lib/security/inputLimits'
import { speakText, stopSpeaking } from '@/lib/speechUtils'
import type { Student, ListeningPassage, ListeningQuestion } from '@/types/platform'
import type { EvaluateSessionResponse } from '@/app/api/evaluate-session/route'
import { useKioskSession } from '../../_components/KioskSessionProvider'

import SessionIntroScreen from '../[skill]/_components/SessionIntroScreen'
import SessionCompleteScreen from '../[skill]/_components/SessionCompleteScreen'
import EndSessionModal from '../_components/EndSessionModal'

type PracticeState = 'loading' | 'intro' | 'passage-playing' | 'question' | 'evaluating' | 'results' | 'error'

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

export default function KioskListeningPracticePage() {
  const router = useRouter()
  const { session: kioskSession, clear } = useKioskSession()

  const [state, setState] = useState<PracticeState>('loading')
  const [student, setStudent] = useState<Student | null>(null)
  const [passage, setPassage] = useState<ListeningPassage | null>(null)
  const [questions, setQuestions] = useState<ListeningQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<string[]>(['', '', '', '', ''])
  const [draft, setDraft] = useState('')
  const [evaluation, setEvaluation] = useState<EvaluateSessionResponse | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [pointsAwarded, setPointsAwarded] = useState<number | null>(null)
  const [updatedTotalPoints, setUpdatedTotalPoints] = useState<number | null>(null)
  const [showTranscript, setShowTranscript] = useState(false)
  const [audioPlaying, setAudioPlaying] = useState(false)
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
        const p = await getRandomPracticePassage(s.level, 'listening') as ListeningPassage
        if (!cancelled) {
          setStudent(s)
          setPassage(p)
          setQuestions(p.questions.slice(0, TOTAL_QUESTIONS) as ListeningQuestion[])
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
  // stops as soon as they hit Start Session (state → passage-playing) or leave.
  useEffect(() => {
    if (state !== 'intro') return
    const line =
      "The AI tutor will read a passage aloud. Listen carefully, then answer the questions that follow. Click on the Start Session button when you're ready."
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

  // ─── Autofocus textarea ──────────────────────────────────────────────────

  useEffect(() => {
    if (state === 'question' && questions[currentIndex]?.type === 'open') {
      setTimeout(() => textareaRef.current?.focus(), 50)
    }
  }, [currentIndex, state, questions])

  useEffect(() => {
    return () => { stopSpeaking() }
  }, [])

  // ─── Passage TTS playback ────────────────────────────────────────────────

  const playPassage = useCallback(() => {
    if (!passage) return
    setAudioPlaying(true)
    speakText(
      passage.passage,
      () => setAudioPlaying(true),
      () => {
        setAudioPlaying(false)
        // Functional setState avoids the stale-closure bug where `state` was
        // captured at define-time (== 'intro') and never matched 'passage-playing'
        // when the audio actually ended — the question screen never appeared.
        setState(prev => (prev === 'passage-playing' ? 'question' : prev))
      }
    )
  }, [passage])

  const stopPassage = useCallback(() => {
    stopSpeaking()
    setAudioPlaying(false)
  }, [])

  const handleStartSession = useCallback(() => {
    setState('passage-playing')
    setTimeout(() => playPassage(), 300)
  }, [playPassage])

  // ─── Evaluate session ────────────────────────────────────────────────────

  const evaluateSession = useCallback(async (allAnswers: string[]) => {
    if (!passage || !kioskSession) return
    stopSpeaking()
    setState('evaluating')
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }

    const payload = {
      skillArea: 'listening' as const,
      level: kioskSession.level,
      contentId: passage.id,
      contentText: passage.passage,
      questions: questions.map((q, i) => ({
        id: q.id,
        type: (q.type || 'open') as 'mcq' | 'open',
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

      const result = await createPracticeSession({
        studentId: kioskSession.studentId,
        skill: 'listening',
        level: kioskSession.level,
        correctCount: data.correctCount,
        totalQuestions: TOTAL_QUESTIONS,
        durationSec: elapsedSeconds,
      })
      setPointsAwarded(result.pointsAwarded)
      setUpdatedTotalPoints(result.student.totalPoints)
      setState('results')
    } catch (err) {
      console.error('[Listening] evaluateSession failed', err)
      setEvaluation({
        overallScore: 0, correctCount: 0,
        perQuestion: questions.map(q => ({ questionId: q.id, isCorrect: false, feedback: 'Could not evaluate — please try again later.' })),
        overallFeedback: 'We were unable to evaluate this session. Your answers were recorded but no points were awarded.',
      })
      setState('results')
    }
  }, [passage, kioskSession, questions, elapsedSeconds, sessionId])

  const handleNext = useCallback(() => {
    const answer = clampLength(draft.trim(), INPUT_LIMITS.PRACTICE_OPEN_ANSWER)
    const next = [...answers]
    next[currentIndex] = answer
    setAnswers(next)
    
    if (currentIndex < TOTAL_QUESTIONS - 1) {
      setCurrentIndex(i => i + 1)
      setDraft(next[currentIndex + 1] || '')
    } else {
      evaluateSession(next)
    }
  }, [answers, currentIndex, draft, evaluateSession])

  const handlePrevious = useCallback(() => {
    const answer = clampLength(draft.trim(), INPUT_LIMITS.PRACTICE_OPEN_ANSWER)
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
    stopSpeaking()
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    setShowEndConfirm(false)
    router.push('/kiosk/practice')
  }, [router])

  // ─── Helpers ─────────────────────────────────────────────────────────────

  const formatTimer = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`
  const skillConfig = SKILL_CONFIG['listening']
  const SkillIcon = skillConfig.icon
  const accentColor = '#E8B96C' // Premium golden accent
  const currentQuestion = questions[currentIndex]
  const progressPct = ((currentIndex) / TOTAL_QUESTIONS) * 100 + (1 / TOTAL_QUESTIONS) * 100

  if (state === 'loading') return <div className="flex items-center justify-center w-full h-full"><Spinner size="lg" /></div>
  if (state === 'error') return (
    <div
      className="flex flex-col items-center justify-center w-full h-full gap-6 px-8 text-center"
      style={{ background: '#F5F5F2', color: '#1A1A1A' }}
    >
      <div style={{ fontSize: 72, color: '#F59E0B' }}>⚠</div>
      <h2 className="font-display font-semibold" style={{ fontSize: 44, color: '#1A1A1A' }}>
        Failed to load session
      </h2>
      <p className="font-body" style={{ fontSize: 22, color: '#555', maxWidth: 600, lineHeight: 1.5 }}>
        We couldn&apos;t load your listening practice. Please try again or ask staff for help.
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
        {state === 'intro' && student && passage && (
          <SessionIntroScreen
            skill="listening"
            levelShort={LEVEL_SHORT[student.level]}
            content={passage}
            onStart={handleStartSession}
          />
        )}

        {/* Passage playing */}
        {state === 'passage-playing' && passage && (
          <div className="flex-1 flex flex-col items-center justify-center gap-8 px-8">
            <div style={{ fontSize: 120 }}>🎧</div>
            <div className="text-center" style={{ maxWidth: 800 }}>
              <h2 className="font-display font-bold text-[var(--text-primary)] mb-6" style={{ fontSize: 48, letterSpacing: '-0.02em' }}>
                {passage.title}
              </h2>
              <p className="font-body text-[var(--text-secondary)]" style={{ fontSize: 28, lineHeight: 1.6 }}>
                Listen carefully — questions will appear after the passage finishes.
              </p>
            </div>
            {/* Animated audio indicator */}
            <div className="flex items-end gap-1" style={{ height: 32 }}>
              {[0.4, 0.7, 1, 0.7, 0.5, 0.8, 0.6].map((h, i) => (
                <div
                  key={i}
                  style={{
                    width: 5, borderRadius: 3,
                    background: accentColor,
                    height: `${h * 100}%`,
                    animation: audioPlaying ? `bounce 0.8s ease-in-out ${i * 0.1}s infinite alternate` : 'none',
                    opacity: audioPlaying ? 1 : 0.3,
                  }}
                />
              ))}
            </div>
            <style>{`@keyframes bounce { from { transform: scaleY(0.4); } to { transform: scaleY(1); } }`}</style>
              <button
              onClick={() => setState('question')}
              style={{
                marginTop: 24, padding: '24px 48px',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 40, fontSize: 28, height: 80,
                fontFamily: 'Geist, sans-serif', background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', fontWeight: 600
              }}
            >
              Skip to questions →
            </button>
          </div>
        )}

        {/* Question */}
        {state === 'question' && passage && currentQuestion && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Sticky audio control */}
            <div style={{
              background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid rgba(255,255,255,0.08)',
              padding: '24px 32px', display: 'flex', alignItems: 'center', gap: 24, flexShrink: 0,
              boxShadow: '0 4px 24px rgba(0,0,0,0.2)'
            }}>
              <div style={{ fontSize: 32 }}>🎧</div>
              <span className="font-body text-[var(--text-primary)] font-medium" style={{ fontSize: 28, flex: 1 }}>
                {passage.title}
              </span>
              <button
                onClick={audioPlaying ? stopPassage : playPassage}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '12px 24px',
                  borderRadius: 20, border: '1px solid',
                  borderColor: audioPlaying ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255,255,255,0.15)',
                  background: audioPlaying ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.05)', cursor: 'pointer',
                  fontSize: 22, fontFamily: 'Geist, sans-serif', color: audioPlaying ? '#FCA5A5' : 'var(--text-primary)',
                  fontWeight: 600, transition: 'all 200ms'
                }}
              >
                {audioPlaying ? <RotateCcw size={22} /> : <Play size={22} />}
                {audioPlaying ? 'Stop' : 'Replay'}
              </button>
              <button
                onClick={() => setShowTranscript(t => !t)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px',
                  borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)',
                  background: showTranscript ? 'rgba(255,255,255,0.1)' : 'transparent', cursor: 'pointer', fontSize: 22,
                  fontFamily: 'Geist, sans-serif', color: 'var(--text-secondary)', fontWeight: 600,
                  transition: 'all 200ms'
                }}
              >
                {showTranscript ? <ChevronUp size={22} /> : <ChevronDown size={22} />}
                {showTranscript ? 'Hide text' : 'Show text'}
              </button>
            </div>

            {/* Transcript panel */}
            {showTranscript && (
              <div style={{
                padding: '32px 48px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(0,0,0,0.4)', maxHeight: 400, overflowY: 'auto', flexShrink: 0,
              }}>
                <p className="font-body text-[var(--text-primary)]" style={{ fontSize: 28, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                  {passage.passage}
                </p>
              </div>
            )}

            {/* Question card */}
            <div className="flex-1 overflow-y-auto" style={{ padding: '48px 64px' }}>
              
              <div style={{
                width: '100%', maxWidth: 900, margin: '0 auto',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: '32px',
                padding: '48px',
                border: '1px solid rgba(255,255,255,0.06)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
                display: 'flex',
                flexDirection: 'column',
              }}>
                {/* Progress */}
                <div style={{ marginBottom: 32 }}>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono font-bold uppercase tracking-widest"
                      style={{ fontSize: 20, color: accentColor }}>
                      Question {currentIndex + 1} of {TOTAL_QUESTIONS}
                    </span>
                  </div>
                  <div style={{ height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', background: accentColor,
                      width: `${progressPct}%`,
                      borderRadius: 4, transition: 'width 200ms ease',
                    }} />
                  </div>
                </div>

                <h2 className="font-display font-semibold text-[var(--text-primary)]" style={{ fontSize: 36, lineHeight: 1.5, marginBottom: 40 }}>
                  {currentQuestion.question}
                </h2>

                {/* MCQ */}
                {currentQuestion.type === 'mcq' && currentQuestion.options && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {currentQuestion.options.map((opt, i) => {
                      const isSelected = draft === opt
                      return (
                        <button
                          key={i}
                          onClick={() => setDraft(opt)}
                          style={{
                            minHeight: 100, padding: '20px 24px', borderRadius: 20,
                            border: '1px solid',
                            borderColor: isSelected ? accentColor : 'rgba(255,255,255,0.1)', 
                            background: isSelected ? 'rgba(232, 185, 108, 0.05)' : 'rgba(0,0,0,0.2)',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 20, textAlign: 'left',
                            transition: 'all 200ms',
                            boxShadow: isSelected ? 'inset 0 4px 16px rgba(0,0,0,0.2)' : 'none'
                          }}
                        >
                          <span className="font-mono font-bold" style={{
                            width: 56, height: 56, borderRadius: 12,
                            background: isSelected ? accentColor : 'rgba(255,255,255,0.1)', 
                            color: isSelected ? '#120A08' : 'var(--text-primary)',
                            fontSize: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            transition: 'all 200ms',
                          }}>
                            {String.fromCharCode(65 + i)}
                          </span>
                          <span className="font-body" style={{ fontSize: 32, color: 'var(--text-primary)' }}>{opt}</span>
                        </button>
                      )
                    })}

                    <div className="flex justify-end gap-4 mt-8">
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
                        disabled={!draft}
                        style={{
                          background: draft ? '#E8B96C' : 'rgba(255,255,255,0.05)',
                          color: draft ? '#120A08' : 'rgba(255,255,255,0.2)',
                          border: 'none', borderRadius: 20, padding: '0 40px', height: 68,
                          fontSize: 26, fontFamily: 'Geist, sans-serif', fontWeight: 600,
                          cursor: draft ? 'pointer' : 'not-allowed', transition: 'background 200ms',
                          boxShadow: draft ? '0 4px 16px rgba(232, 185, 108, 0.2), inset 0 2px 0 rgba(255,255,255,0.2)' : 'none'
                        }}
                      >
                        {currentIndex < TOTAL_QUESTIONS - 1 ? 'Next' : 'Finish'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Open */}
                {currentQuestion.type === 'open' && (
                  <div>
                    <textarea
                      ref={textareaRef}
                      value={draft}
                      onChange={e => setDraft(clampLength(e.target.value, INPUT_LIMITS.PRACTICE_OPEN_ANSWER))}
                      maxLength={INPUT_LIMITS.PRACTICE_OPEN_ANSWER}
                      placeholder="Type your answer here…"
                      rows={4}
                      style={{
                        width: '100%', padding: '24px 32px', borderRadius: 20,
                        border: '1px solid rgba(255,255,255,0.1)', fontSize: 32, lineHeight: 1.6,
                        color: 'var(--text-primary)',
                        fontFamily: 'Geist, sans-serif', resize: 'vertical', boxSizing: 'border-box', outline: 'none',
                        background: 'rgba(0,0,0,0.2)',
                        transition: 'border-color 200ms, box-shadow 200ms',
                        boxShadow: 'inset 0 4px 16px rgba(0,0,0,0.2)'
                      }}
                      onFocus={e => {
                        e.target.style.borderColor = accentColor
                        e.target.style.boxShadow = `0 0 0 2px rgba(232, 185, 108, 0.2), inset 0 4px 16px rgba(0,0,0,0.2)`
                      }}
                      onBlur={e => {
                        e.target.style.borderColor = 'rgba(255,255,255,0.1)'
                        e.target.style.boxShadow = 'inset 0 4px 16px rgba(0,0,0,0.2)'
                      }}
                    />

                    <div className="flex items-center justify-between mt-8">
                      <span className="font-mono" style={{ fontSize: 22, color: 'var(--text-muted)' }}>
                        <span style={{ color: draft.trim() ? accentColor : 'var(--text-muted)' }}>
                          {draft.trim() && '✓ '}
                          {draft.trim().split(/\s+/).filter(Boolean).length} word
                          {draft.trim().split(/\s+/).filter(Boolean).length !== 1 ? 's' : ''}
                        </span>
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
                          disabled={!draft.trim()}
                          style={{
                            background: draft.trim() ? '#E8B96C' : 'rgba(255,255,255,0.05)',
                            color: draft.trim() ? '#120A08' : 'rgba(255,255,255,0.2)',
                            border: 'none', borderRadius: 20, padding: '0 40px', height: 68,
                            fontSize: 26, fontFamily: 'Geist, sans-serif', fontWeight: 600,
                            cursor: draft.trim() ? 'pointer' : 'not-allowed', transition: 'background 200ms',
                            boxShadow: draft.trim() ? '0 4px 16px rgba(232, 185, 108, 0.2), inset 0 2px 0 rgba(255,255,255,0.2)' : 'none'
                          }}
                        >
                          {currentIndex < TOTAL_QUESTIONS - 1 ? 'Next' : 'Finish'}
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
              The AI is reviewing all 5 of your answers.
            </p>
          </div>
        )}

        {/* Results */}
        {state === 'results' && (
          <SessionCompleteScreen
            skill="listening"
            exchangeCount={TOTAL_QUESTIONS}
            elapsedSeconds={elapsedSeconds}
            pointsAwarded={pointsAwarded}
            updatedTotalPoints={updatedTotalPoints}
            studentFirstName={kioskSession?.studentName?.split(' ')[0] || 'there'}
            onPractiseAgain={() => router.push('/kiosk/practice')}
            onBackToMenu={() => router.push('/kiosk/menu')}
            evaluation={evaluation}
            questionTexts={Object.fromEntries(questions.map(q => [q.id, q.question]))}
            studentAnswers={Object.fromEntries(questions.map((q, i) => [q.id, answers[i] || '']))}
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
