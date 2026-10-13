'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, LogOut, Send, Mic, Square } from 'lucide-react'
import { Spinner, Badge, Button } from '@/components/ui'
import { getStudentById, recordPracticeResult } from '@/lib/services'
import { getRandomPracticePassage, getRandomPracticePrompt } from '@/lib/services'
import { SKILL_CONFIG } from '@/lib/skillConfig'
import { startPTTRecording, stopPTTRecording, speakText, stopSpeaking } from '@/lib/speechUtils'
import type { ContentContext } from '@/lib/prompts'
import type { Student, SkillArea, SkillLevel, ReadingPassage, WritingPrompt, SpeakingTopic, ListeningPassage } from '@/types/platform'
import type { Message, FeedbackItem, VoiceState } from '@/types'
import { useKioskSession } from '../../_components/KioskSessionProvider'

// Lazy imports for sub-components (co-located)
import SessionIntroScreen from './_components/SessionIntroScreen'
import ChatTranscript from './_components/ChatTranscript'
import SessionCompleteScreen from './_components/SessionCompleteScreen'

// ─── Types ────────────────────────────────────────────────────────────────────

type SessionState = 'loading' | 'intro' | 'chatting' | 'ended'
type ContentItem = ReadingPassage | WritingPrompt | SpeakingTopic | ListeningPassage

interface ChatMessage extends Message {
  vocab?: string[]
  feedback?: FeedbackItem[]
  score?: number
  options?: string[]
}

// ─── UUID helper ──────────────────────────────────────────────────────────────

function generateUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

const VALID_SKILLS = new Set<string>(['reading', 'writing', 'speaking', 'listening'])

// ─── Session timeout constants ───────────────────────────────────────────────
// Auto-end practice sessions to avoid:
//   - fake inflated times when student walks away
//   - lost work when network drops (5 min idle = autosave with credit)
//   - infinite sessions when next student logs in without ending the previous
const IDLE_TIMEOUT_MS = 5 * 60 * 1000      // 5 min of no user message → end
const HARD_CAP_MS     = 20 * 60 * 1000     // 20 min total cap → end
const IDLE_CHECK_INTERVAL_MS = 30 * 1000   // check both thresholds every 30s

const LEVEL_SHORT: Record<SkillLevel, string> = {
  'entry-1': 'E1', 'entry-2': 'E2', 'entry-3': 'E3', 'level-1': 'L1',
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function KioskPracticeSessionPage() {
  const router = useRouter()
  const params = useParams()
  const skill = params.skill as string

  // Core state
  const [sessionState, setSessionState] = useState<SessionState>('loading')
  const [student, setStudent] = useState<Student | null>(null)
  const [content, setContent] = useState<ContentItem | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [voiceState, setVoiceState] = useState<VoiceState>('idle')
  const [inputText, setInputText] = useState('')
  const [error, setError] = useState('')
  const [sessionStartTime, setSessionStartTime] = useState<number>(0)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  // Points / session-id state
  const [pointsAwarded, setPointsAwarded] = useState<number | null>(null)
  const [updatedTotalPoints, setUpdatedTotalPoints] = useState<number | null>(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [sessionId] = useState(generateUuid)

  // Kiosk session
  const { session: kioskSession, clear } = useKioskSession()

  // Refs for cleanup
  const abortRef = useRef<AbortController | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const idleCheckRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Auto-end tracking — track student activity for idle timeout + hard cap
  const lastUserMessageTimeRef = useRef<number>(0)
  const timerStartTimeRef = useRef<number>(0)
  // For reading: defer timer start until the student sends their first message
  // (so the passage-reading time doesn't count against them)
  const timerStartedRef = useRef<boolean>(false)
  // Track auto-end reason so the complete screen can mention it
  const [autoEndReason, setAutoEndReason] = useState<'idle' | 'cap' | null>(null)

  // ─── Validate skill param ────────────────────────────────────────────────

  useEffect(() => {
    if (!VALID_SKILLS.has(skill)) {
      router.replace('/kiosk/practice')
    }
  }, [skill, router])

  const validSkill = VALID_SKILLS.has(skill) ? (skill as SkillArea) : null

  // ─── Load student + content ──────────────────────────────────────────────

  useEffect(() => {
    if (!validSkill) return
    // Redirect to PIN page if no kiosk session (page refresh or direct URL access)
    if (!kioskSession) {
      router.replace('/kiosk')
      return
    }
    let cancelled = false

    async function load() {
      try {
        const s = await getStudentById(kioskSession!.studentId)
        if (cancelled || !s) {
          if (!cancelled) setError('Student not found')
          return
        }

        let c: ContentItem
        if (validSkill === 'reading') {
          c = await getRandomPracticePassage(s.level, 'reading')
        } else if (validSkill === 'listening') {
          c = await getRandomPracticePassage(s.level, 'listening')
        } else if (validSkill === 'writing') {
          c = await getRandomPracticePrompt(s.level, 'writing')
        } else {
          c = await getRandomPracticePrompt(s.level, 'speaking')
        }

        if (!cancelled) {
          setStudent(s)
          setContent(c)
          setSessionState('intro')
        }
      } catch {
        if (!cancelled) setError('Failed to load session content')
      }
    }
    load()
    return () => { cancelled = true }
  }, [validSkill, kioskSession, router])

  // ─── Session timer ───────────────────────────────────────────────────────
  // For reading: the AI's first message is the passage — don't time the read.
  // Timer starts when student sends their first answer (handled in sendMessage).
  // For other skills: timer starts immediately when chatting begins.

  const startSessionTimer = useCallback(() => {
    if (timerStartedRef.current) return
    timerStartedRef.current = true
    const start = Date.now()
    timerStartTimeRef.current = start
    setSessionStartTime(start)
    lastUserMessageTimeRef.current = start  // reset idle baseline
    timerRef.current = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - start) / 1000))
    }, 1000)
  }, [])

  useEffect(() => {
    if (sessionState !== 'chatting') return
    // Reading: defer until first user message (passage read time is free)
    // Everything else: start now
    if (validSkill !== 'reading') {
      startSessionTimer()
    }
    return () => {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
      timerStartedRef.current = false
    }
  }, [sessionState, validSkill, startSessionTimer])

  // ─── Cleanup on unmount ──────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
      stopSpeaking()
      // Stop any active recording
      stopPTTRecording().catch(() => {})
    }
  }, [])

  // ─── Send message to AI ──────────────────────────────────────────────────

  const sendMessage = useCallback(async (text: string) => {
    if (!student || !content || !validSkill) return

    // Reset idle baseline + start the timer if this is the first real message
    // (mainly matters for reading, where timer was deferred until now)
    if (text) {
      lastUserMessageTimeRef.current = Date.now()
      if (!timerStartedRef.current) {
        startSessionTimer()
      }
    }

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    }

    const updatedMessages = text ? [...messages, userMsg] : [...messages]
    if (text) setMessages(updatedMessages)
    setVoiceState('thinking')
    setError('')

    const ctx: ContentContext = { skillArea: validSkill, content } as ContentContext

    try {
      abortRef.current = new AbortController()
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
          context: ctx,
        }),
        signal: abortRef.current.signal,
      })

      if (!res.ok) throw new Error(`API error: ${res.status}`)

      const data = await res.json()
      const aiMsg: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        role: 'assistant',
        content: data.reply || 'I\'m here to help. Please go ahead!',
        timestamp: new Date(),
        vocab: data.vocab,
        feedback: data.feedback,
        score: data.score,
        options: Array.isArray(data.options) ? data.options : undefined,
      }

      setMessages(prev => [...prev, aiMsg])

      // Count a correct answer when the AI returns a positive-icon feedback item.
      // FeedbackItem has { icon, text } — no 'type' field.
      // Positive icons used by the AI system prompt: ✅ 🎉 👏 ⭐
      const POSITIVE_ICONS = ['✅', '🎉', '👏', '⭐']
      if (aiMsg.feedback?.some(f => POSITIVE_ICONS.some(icon => f.icon.startsWith(icon)))) {
        setCorrectCount(prev => Math.min(prev + 1, 5))
      }

      // TTS: speak the AI's reply for reading / speaking / listening.
      // (Writing stays text-only — it's a deliberate written-skill exercise.)
      if (validSkill === 'reading' || validSkill === 'speaking' || validSkill === 'listening') {
        speakText(
          aiMsg.content,
          () => setVoiceState('speaking'),
          () => setVoiceState('idle')
        )
      } else {
        setVoiceState('idle')
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      setVoiceState('error')
      setError('Failed to get AI response. Tap to retry.')
    }
  }, [student, content, validSkill, messages])

  // ─── Handle start session ────────────────────────────────────────────────

  const handleStart = useCallback(() => {
    setSessionState('chatting')

    // For Listening: speak the passage text directly via TTS before triggering the AI greeting.
    // This ensures the student hears the passage before questions begin.
    if (validSkill === 'listening' && content) {
      const passage = content as ListeningPassage
      speakText(
        passage.passage,
        () => setVoiceState('speaking'),
        () => {
          setVoiceState('idle')
          // After TTS finishes reading the passage, trigger the AI's first greeting
          sendMessage('')
        }
      )
    } else {
      // For all other skills: trigger the AI's opening message immediately
      sendMessage('')
    }
  }, [validSkill, content, sendMessage])

  // ─── Handle PTT ──────────────────────────────────────────────────────────

  const handlePTT = useCallback(async () => {
    if (voiceState === 'listening') {
      // Stop recording → transcribe → send
      setVoiceState('thinking')
      try {
        const transcript = await stopPTTRecording()
        if (transcript.trim()) {
          sendMessage(transcript.trim())
        } else {
          setVoiceState('idle')
          setError('Could not hear you. Please try again.')
        }
      } catch {
        setVoiceState('error')
        setError('Recording failed. Please try again.')
      }
    } else if (voiceState === 'speaking') {
      // Interrupt TTS
      stopSpeaking()
      setVoiceState('idle')
    } else {
      // Start recording
      try {
        await startPTTRecording()
        setVoiceState('listening')
        setError('')
      } catch {
        setVoiceState('error')
        setError('Microphone access required. Please allow and try again.')
      }
    }
  }, [voiceState, sendMessage])

  // ─── Handle text submit ──────────────────────────────────────────────────

  const handleTextSubmit = useCallback(() => {
    const text = inputText.trim()
    if (!text || voiceState === 'thinking') return
    setInputText('')
    sendMessage(text)
  }, [inputText, voiceState, sendMessage])

  // ─── Handle MCQ option tap ───────────────────────────────────────────────

  const handleOptionClick = useCallback((option: string) => {
    if (voiceState === 'thinking') return
    // Stop any in-progress TTS so the AI's response can speak the feedback fresh
    stopSpeaking()
    sendMessage(option)
  }, [voiceState, sendMessage])
  // ─── Handle end session ──────────────────────────────────────────────

  const handleEndSession = useCallback(async (autoEndMode?: 'idle' | 'cap') => {
    // Manual end: confirm. Auto-end (idle/cap): skip confirm.
    if (!autoEndMode) {
      if (!window.confirm('End this session?')) return
    }
    stopSpeaking()
    stopPTTRecording().catch(() => {})
    abortRef.current?.abort()
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    if (idleCheckRef.current) { clearInterval(idleCheckRef.current); idleCheckRef.current = null }

    if (autoEndMode) setAutoEndReason(autoEndMode)

    // Award points — MUST happen before routing back to /kiosk (which clears the session).
    // Auto-ends (idle/cap) save the session as 'abandoned' with NO points awarded.
    if (kioskSession) {
      const level = kioskSession.level
      const skill = (VALID_SKILLS.has(params.skill as string) ? params.skill : 'reading') as SkillArea
      try {
        const result = await recordPracticeResult({
          studentId: kioskSession.studentId,
          skillArea: skill,
          level,
          correctCount,
          totalCount: 5,
          sessionId,
          durationSec: elapsedSeconds,
          status: autoEndMode ? 'abandoned' : 'completed',
        })
        setPointsAwarded(result.pointsAwarded)
        setUpdatedTotalPoints(result.student.totalPoints)
      } catch {
        // Service failure is non-blocking — show complete screen without points badge
        console.warn('[Phase 10d] recordPracticeResult failed')
        setPointsAwarded(null)
      }
    }

    setSessionState('ended')
  }, [kioskSession, correctCount, sessionId, elapsedSeconds, params.skill])

  // ─── Idle / hard-cap watcher ─────────────────────────────────────────────
  // Checks every 30s while chatting:
  //   • If no user message for IDLE_TIMEOUT_MS → auto-end (idle)
  //   • If total session time exceeds HARD_CAP_MS → auto-end (cap)
  // Both paths credit whatever points the student earned so far.
  useEffect(() => {
    if (sessionState !== 'chatting') return
    idleCheckRef.current = setInterval(() => {
      // If timer hasn't started yet (e.g. reading passage still being read), skip
      if (!timerStartedRef.current) return

      const now = Date.now()
      const idleMs = now - lastUserMessageTimeRef.current
      const totalMs = now - timerStartTimeRef.current

      if (totalMs >= HARD_CAP_MS) {
        handleEndSession('cap')
        return
      }
      if (idleMs >= IDLE_TIMEOUT_MS) {
        handleEndSession('idle')
        return
      }
    }, IDLE_CHECK_INTERVAL_MS)
    return () => {
      if (idleCheckRef.current) { clearInterval(idleCheckRef.current); idleCheckRef.current = null }
    }
  }, [sessionState, handleEndSession])

  // ─── Format timer ────────────────────────────────────────────────────────

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  // ─── Derived ─────────────────────────────────────────────────────────────

  const exchangeCount = messages.filter(m => m.role === 'user').length
  const lastAIMsg = [...messages].reverse().find(m => m.role === 'assistant')
  const lastFeedback = lastAIMsg?.feedback?.map(f => `${f.icon} ${f.text}`).join(' ') || lastAIMsg?.content

  // When the latest AI message has MCQ options, hide the text/PTT input panel —
  // the student answers by tapping a button. Avoids "should I type or tap?" confusion.
  const hasActiveOptions = !!(lastAIMsg?.options && lastAIMsg.options.length > 0)

  const skillConfig = validSkill ? SKILL_CONFIG[validSkill] : null
  const SkillIcon = skillConfig?.icon

  // ─── Loading / Error ─────────────────────────────────────────────────────

  if (!validSkill) return null

  if (sessionState === 'loading' && !error) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error && sessionState === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full gap-6 px-8 text-center">
        <div style={{ fontSize: 28 }}>⚠</div>
        <h2 className="font-display font-semibold" style={{ fontSize: 22, color: 'var(--text-primary)' }}>
          {error}
        </h2>
        <button
          onClick={() => router.push('/kiosk/practice')}
          className="font-body cursor-pointer outline-none"
          style={{ fontSize: 16, color: 'var(--accent-primary)', background: 'none', border: 'none', padding: '12px 24px' }}
        >
          ← Back to skill picker
        </button>
      </div>
    )
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col w-full h-full" style={{ background: '#fafafa' }}>
      {/* ─── Top Bar ─────────────────────────────────────────────────────── */}
      <header
        className="flex items-center justify-between shrink-0"
        style={{
          padding: '16px 32px',
          background: '#ffffff',
          boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
          minHeight: 72,
          zIndex: 10,
        }}
      >
        <button
          onClick={() => {
            if (sessionState === 'chatting') {
              handleEndSession()
            } else {
              router.push('/kiosk/practice')
            }
          }}
          className="inline-flex items-center gap-2 font-body font-medium cursor-pointer outline-none select-none"
          style={{ fontSize: 14, color: 'var(--text-secondary)', background: 'none', border: 'none', padding: '8px 12px', minHeight: 48 }}
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <div className="flex items-center gap-3">
          {SkillIcon && <SkillIcon size={18} style={{ color: skillConfig!.iconColor }} />}
          <span className="font-display font-semibold" style={{ fontSize: 16, color: 'var(--text-primary)' }}>
            {skillConfig?.label}
          </span>
          {student && <Badge variant="default" size="sm">{LEVEL_SHORT[student.level]}</Badge>}
          {sessionState === 'chatting' && (
            <span className="font-mono" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {formatTimer(elapsedSeconds)}
            </span>
          )}
        </div>

        <button
          onClick={() => {
            if (sessionState === 'chatting') handleEndSession()
            else {
              clear()
              router.replace('/kiosk')
            }
          }}
          className="inline-flex items-center gap-2 font-body font-medium cursor-pointer outline-none select-none"
          style={{
            fontSize: 13, color: 'var(--accent-danger)', background: 'transparent',
            border: '1px solid color-mix(in srgb, var(--accent-danger) 35%, transparent)',
            borderRadius: 'var(--radius-md)', padding: '8px 16px', minHeight: 40,
          }}
        >
          <LogOut size={16} />
          End
        </button>
      </header>

      {/* ─── Main Content ────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col" style={{ minHeight: 0, overflow: 'hidden' }}>
        {/* Intro screen */}
        {sessionState === 'intro' && student && content && (
          <SessionIntroScreen
            skill={validSkill}
            levelShort={LEVEL_SHORT[student.level]}
            content={content}
            onStart={handleStart}
          />
        )}

        {/* Chat screen */}
        {sessionState === 'chatting' && (
          <>
            {/* Transcript (scrollable) */}
            <div className="flex-1" style={{ overflow: 'auto', minHeight: 0 }}>
              <ChatTranscript
                messages={messages}
                isAITyping={voiceState === 'thinking'}
                onOptionClick={handleOptionClick}
                optionsDisabled={voiceState === 'thinking'}
              />
            </div>

            {/* Error banner */}
            {error && sessionState === 'chatting' && (
              <div
                className="font-body text-center shrink-0"
                style={{
                  padding: '8px 16px', fontSize: 13,
                  background: 'color-mix(in srgb, var(--accent-danger) 8%, transparent)',
                  color: 'var(--accent-danger)',
                  borderTop: '1px solid color-mix(in srgb, var(--accent-danger) 20%, transparent)',
                }}
              >
                {error}
                <button
                  onClick={() => { setError(''); setVoiceState('idle') }}
                  className="font-semibold cursor-pointer outline-none"
                  style={{ marginLeft: 8, background: 'none', border: 'none', color: 'inherit', textDecoration: 'underline' }}
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Input area — stays visible but disabled when AI is awaiting an MCQ tap */}
            <div
              className="shrink-0"
              style={{
                padding: '24px 32px 32px', 
                background: '#ffffff',
                boxShadow: '0 -12px 40px rgba(0,0,0,0.03)',
                opacity: hasActiveOptions ? 0.3 : 1,
                transition: 'opacity 300ms ease',
                pointerEvents: hasActiveOptions ? 'none' : 'auto',
                zIndex: 10,
              }}
            >
              {/* Text input (reading, writing, listening) */}
              {(validSkill === 'reading' || validSkill === 'writing' || validSkill === 'listening') && (
                <div className="flex gap-3 items-end">
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleTextSubmit()
                      }
                    }}
                    placeholder={
                      validSkill === 'writing'
                        ? 'Write your response here...'
                        : 'Type your answer...'
                    }
                    disabled={voiceState === 'thinking'}
                    className="font-body flex-1 outline-none"
                    style={{
                      fontSize: 16, padding: '16px 24px', borderRadius: '24px',
                      border: '1.5px solid rgba(0,0,0,0.04)', background: '#f8f9fa',
                      color: 'var(--text-primary)', resize: validSkill === 'writing' ? 'vertical' : 'none',
                      minHeight: validSkill === 'writing' ? 120 : 56, maxHeight: 200,
                      lineHeight: 1.6,
                      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.01)'
                    }}
                    rows={validSkill === 'writing' ? 4 : 1}
                  />

                  <div className="flex gap-2">
                    {/* PTT button for listening (optional voice input) */}
                    {validSkill === 'listening' && (
                      <button
                        onClick={handlePTT}
                        disabled={voiceState === 'thinking'}
                        className="flex items-center justify-center cursor-pointer outline-none select-none active:scale-95"
                        style={{
                          width: 56, height: 56, borderRadius: 'var(--radius-full)',
                          background: voiceState === 'listening' ? 'var(--accent-danger)' : '#f4f4f5',
                          border: 'none',
                          color: voiceState === 'listening' ? 'white' : 'var(--text-secondary)',
                          transition: 'background 150ms, transform 100ms',
                        }}
                        aria-label={voiceState === 'listening' ? 'Stop recording' : 'Record voice'}
                      >
                        {voiceState === 'listening' ? <Square size={18} /> : <Mic size={18} />}
                      </button>
                    )}

                    <Button
                      variant="primary"
                      onClick={handleTextSubmit}
                      disabled={!inputText.trim() || voiceState === 'thinking'}
                      className="gap-2 outline-none active:scale-[0.96] flex items-center justify-center"
                      style={{ 
                        width: 56, height: 56, borderRadius: '28px', padding: 0,
                        boxShadow: '0 8px 24px color-mix(in srgb, var(--accent-primary) 30%, transparent)' 
                      }}
                    >
                      <Send size={20} style={{ marginLeft: 2 }} />
                    </Button>
                  </div>
                </div>
              )}

              {/* PTT only (speaking) */}
              {validSkill === 'speaking' && (
                <div className="flex flex-col items-center gap-3">
                  <button
                    onClick={handlePTT}
                    disabled={voiceState === 'thinking'}
                    className="flex items-center justify-center cursor-pointer outline-none select-none"
                    style={{
                      width: 80, height: 80, borderRadius: 'var(--radius-full)',
                      background: voiceState === 'listening'
                        ? 'var(--accent-danger)'
                        : voiceState === 'speaking'
                          ? 'var(--accent-primary)'
                          : 'var(--accent-warning)',
                      border: 'none', color: 'white',
                      boxShadow: voiceState === 'listening'
                        ? '0 0 0 8px color-mix(in srgb, var(--accent-danger) 20%, transparent)'
                        : 'var(--shadow-card)',
                      transition: 'background 150ms, box-shadow 150ms, transform 150ms',
                      transform: voiceState === 'listening' ? 'scale(1.1)' : 'scale(1)',
                    }}
                    aria-label={voiceState === 'listening' ? 'Stop recording' : 'Push to talk'}
                  >
                    {voiceState === 'listening'
                      ? <Square size={28} />
                      : voiceState === 'thinking'
                        ? <Spinner size="sm" />
                        : <Mic size={28} />
                    }
                  </button>
                  <span className="font-mono" style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    {voiceState === 'listening' ? 'Listening… tap to stop'
                      : voiceState === 'thinking' ? 'Processing…'
                      : voiceState === 'speaking' ? 'AI speaking… tap to interrupt'
                      : 'Tap to speak'}
                  </span>
                </div>
              )}
            </div>
          </>
        )}

        {/* Complete screen */}
        {sessionState === 'ended' && (
          <SessionCompleteScreen
            skill={validSkill}
            exchangeCount={exchangeCount}
            elapsedSeconds={elapsedSeconds}
            lastFeedback={lastFeedback}
            pointsAwarded={pointsAwarded}
            updatedTotalPoints={updatedTotalPoints}
            studentFirstName={kioskSession?.studentName?.split(' ')[0] || 'there'}
            autoEndReason={autoEndReason}
            onPractiseAgain={() => router.push('/kiosk/practice')}
            onBackToMenu={() => router.push('/kiosk/menu')}
          />
        )}
      </div>
    </div>
  )
}
