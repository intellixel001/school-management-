'use client'

/**
 * @file app/kiosk/voice/page.tsx
 * @description AI Voice Tutor — Groq-backed conversational chat with the
 * legacy orb kept intact. Layout is split vertically:
 *   • Top half: interactive VoiceOrb + latest AI line (reacts to mic phase)
 *   • Bottom half: chat message history + big PTT mic button
 *
 * Groq is called via the existing `sendTutorMessage` service. The AI reply
 * is spoken with `speakText()` while the orb glows in the AI-speaking state.
 *
 * User's four locked design choices:
 *   1A — transcripts auto-send (no edit step)
 *   2B — reply appears in chat AND is read aloud (TTS)
 *   3A — conversation resets every page visit (fresh state)
 *   4A — small "New conversation" button for mid-session reset
 *
 * The realtime code (`useQwenRealtime`, `useMicrophone`, `VoiceTranscript`,
 * `types/realtime.ts`) is left in place but no longer imported here.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'
import { getStudentById } from '@/lib/services'
import { sendTutorMessage, type ConversationTurn } from '@/lib/services/tutor'
import { startPTTRecording, stopPTTRecording, speakText, stopSpeaking } from '@/lib/speechUtils'
import { Spinner, BlueBackButton } from '@/components/ui'
import { ServiceError } from '@/lib/services/errors'
import type { Student, SkillLevel } from '@/types/platform'

import ShaderBackdrop from './_components/ShaderBackdrop'
import VoiceIntro from './_components/VoiceIntro'
import VoiceOrb from './_components/VoiceOrb'
import ChatBubble from './_components/ChatBubble'
import VoiceMicButton, { type MicPhase } from './_components/VoiceMicButton'
import { useTransition } from '../_components/TransitionProvider'
import { useKioskSession } from '../_components/KioskSessionProvider'

// ─── Types ────────────────────────────────────────────────────────────────────

type PageState = 'loading' | 'intro' | 'chatting' | 'error'
type OrbState  = 'idle' | 'connected' | 'user_speaking' | 'ai_speaking' | 'thinking' | 'error'

const LEVEL_LABEL: Record<SkillLevel, string> = {
  'entry-1': 'Entry Level 1', 'entry-2': 'Entry Level 2',
  'entry-3': 'Entry Level 3', 'level-1': 'Level 1',
}

// Hard cap so a stuck backend or broken TTS can't lock the mic button.
const AI_REPLY_TIMEOUT_MS = 30_000

// Map mic phase → orb visual state.
function micToOrb(m: MicPhase): OrbState {
  switch (m) {
    case 'recording':    return 'user_speaking'
    case 'transcribing': return 'thinking'
    case 'thinking':     return 'thinking'
    case 'speaking':     return 'ai_speaking'
    default:             return 'idle'
  }
}

// The AI's opening line — scripted so we don't burn a Groq call on hello.
function buildOpener(levelLabel: string): string {
  return `Hi! I'm your AI English tutor for ${levelLabel}. Tap the microphone or hold the spacebar and tell me what you'd like to talk about, or ask me a question.`
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function KioskVoicePage() {
  const router = useRouter()
  const { signalMounted } = useTransition()
  const { session: kioskSession } = useKioskSession()

  const [pageState, setPageState]       = useState<PageState>('loading')
  const [loadError, setLoadError]       = useState('')
  const [student, setStudent]           = useState<Student | null>(null)

  const [micPhase, setMicPhase]         = useState<MicPhase>('idle')
  const [recordingSecs, setRecSecs]     = useState(0)
  const [conversation, setConversation] = useState<ConversationTurn[]>([])
  const [toast, setToast]               = useState('')

  const recTimerRef  = useRef<ReturnType<typeof setInterval> | null>(null)
  const scrollRef    = useRef<HTMLDivElement>(null)
  const sessionIdRef = useRef<string>('')

  const introSpokenRef = useRef(false)
  const openerFiredRef = useRef(false)
  const isMountedRef   = useRef(true)

  // ── Load student ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!kioskSession) { router.replace('/kiosk'); return }
    let cancelled = false
    getStudentById(kioskSession.studentId)
      .then(s => {
        if (cancelled) return
        if (s) { setStudent(s); setPageState('intro') }
        else { setLoadError('Could not load your profile'); setPageState('error') }
      })
      .catch(() => {
        if (!cancelled) { setLoadError('Failed to load student data'); setPageState('error') }
      })
    return () => { cancelled = true }
  }, [kioskSession, router])

  // ── Signal to the transition overlay we're ready ─────────────────────────
  useEffect(() => {
    if (pageState === 'loading') return
    const id = requestAnimationFrame(() => signalMounted())
    return () => cancelAnimationFrame(id)
  }, [pageState, signalMounted])

  // ── Auto-scroll chat panel to newest ─────────────────────────────────────
  useEffect(() => {
    if (!scrollRef.current) return
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [conversation, micPhase])

  // ── Recording timer ───────────────────────────────────────────────────────
  useEffect(() => {
    if (micPhase !== 'recording') {
      if (recTimerRef.current) { clearInterval(recTimerRef.current); recTimerRef.current = null }
      return
    }
    setRecSecs(0)
    recTimerRef.current = setInterval(() => setRecSecs(s => s + 1), 1000)
    return () => { if (recTimerRef.current) { clearInterval(recTimerRef.current); recTimerRef.current = null } }
  }, [micPhase])

  // ── Full cleanup on unmount ───────────────────────────────────────────────
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      stopSpeaking()
      stopPTTRecording().catch(() => {})
      if (recTimerRef.current) clearInterval(recTimerRef.current)
    }
  }, [])

  // ── Intro TTS — spoken once when the intro card appears ──────────────────
  useEffect(() => {
    if (pageState !== 'intro' || !student) return
    if (introSpokenRef.current) return
    introSpokenRef.current = true

    const levelLabel = LEVEL_LABEL[student.level]
    const line = `Hello. I'm your AI tutor for ${levelLabel}. Speak naturally — we'll have a conversation.`
    // Slight delay so the intro entrance animation finishes first.
    const id = window.setTimeout(() => speakText(line), 700)
    return () => {
      window.clearTimeout(id)
      stopSpeaking()
    }
  }, [pageState, student])

  // ── Toast helper ──────────────────────────────────────────────────────────
  const showToast = useCallback((msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(''), 4000)
  }, [])

  // ── Speak an AI turn and manage the "speaking" phase around it ───────────
  const speakAiTurn = useCallback((text: string) => {
    setMicPhase('speaking')
    let released = false
    const release = () => {
      if (released) return
      released = true
      setMicPhase('idle')
    }
    speakText(text, undefined, release)
    // Fallback in case the browser never fires onend (some Windows voices).
    window.setTimeout(release, Math.max(4_000, text.length * 90))
  }, [])

  // ── Send transcript to Groq + speak the reply ────────────────────────────
  const askTutor = useCallback(async (userText: string) => {
    if (!student) return
    const nextHistory: ConversationTurn[] = [
      ...conversation,
      { role: 'user', content: userText },
    ]
    setConversation(nextHistory)
    setMicPhase('thinking')

    // Wait for React to commit + paint the user bubble before firing the API
    // call. Without this, a near-instant Groq response can race ahead and both
    // bubbles appear in the same render, making the AI reply seem to come first.
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))

    let settled = false
    const guard = window.setTimeout(() => {
      if (!isMountedRef.current || settled) return
      settled = true
      setMicPhase('idle')
      showToast('The tutor took too long to reply. Please try again.')
    }, AI_REPLY_TIMEOUT_MS)

    try {
      const res = await sendTutorMessage({
        sessionId:           sessionIdRef.current,
        message:             userText,
        studentName:         student.name.split(' ')[0],
        studentLevel:        student.level,
        skill:               'general',
        conversationHistory: nextHistory,
      })
      if (!isMountedRef.current || settled) return
      settled = true
      window.clearTimeout(guard)

      const reply = (res.message ?? '').trim()
      if (!reply) {
        setMicPhase('idle')
        showToast('The tutor did not send a reply. Please try again.')
        return
      }
      if (res.sessionId) sessionIdRef.current = res.sessionId

      setConversation(prev => [...prev, { role: 'assistant', content: reply }])
      speakAiTurn(reply)
    } catch (err) {
      if (!isMountedRef.current || settled) return
      settled = true
      window.clearTimeout(guard)
      setMicPhase('idle')

      // Surface the real reason so we can diagnose issues like "backend not
      // deployed yet" or "429 rate limit" without opening DevTools.
      // eslint-disable-next-line no-console
      console.error('[AI Tutor] sendTutorMessage failed:', err)
      if (err instanceof ServiceError) {
        if (err.code === 'RATE_LIMITED') {
          showToast('Too many messages just now — please wait a minute.')
        } else if (err.code === 'NETWORK_ERROR') {
          showToast("Can't reach the tutor. Check your connection and try again.")
        } else if (err.code === 'SERVICE_ERROR') {
          showToast('The AI service is temporarily unavailable. Please try again.')
        } else {
          showToast(`Tutor error: ${err.message}`)
        }
      } else {
        showToast('Something unexpected happened. Please try again.')
      }
    }
  }, [student, conversation, showToast, speakAiTurn])

  // ── Mic tap-to-toggle handler ────────────────────────────────────────────
  const handleMicPress = useCallback(async () => {
    if (micPhase === 'idle') {
      stopSpeaking()
      try {
        setMicPhase('recording')
        await startPTTRecording()
      } catch {
        setMicPhase('idle')
        showToast('Microphone access required. Please allow and try again.')
      }
      return
    }

    if (micPhase === 'recording') {
      setMicPhase('transcribing')
      try {
        const text = await stopPTTRecording()
        const clean = (text ?? '').trim()
        if (!clean) {
          setMicPhase('idle')
          showToast("Couldn't hear you clearly. Please try again.")
          return
        }
        await askTutor(clean)
      } catch {
        setMicPhase('idle')
        showToast('Recording failed. Please try again.')
      }
    }
  }, [micPhase, askTutor, showToast])

  // ── Spacebar Push-To-Talk ────────────────────────────────────────────────
  useEffect(() => {
    if (pageState !== 'chatting') return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        // Don't intercept if user is focusing a button (e.g. New Conversation)
        if (e.target instanceof HTMLButtonElement) return
        e.preventDefault()
        if (!e.repeat && micPhase === 'idle') {
          handleMicPress()
        }
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        if (e.target instanceof HTMLButtonElement) return
        e.preventDefault()
        if (micPhase === 'recording') {
          handleMicPress()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [pageState, micPhase, handleMicPress])

  // ── New conversation reset ────────────────────────────────────────────────
  const handleNewConversation = useCallback(() => {
    stopSpeaking()
    stopPTTRecording().catch(() => {})
    setConversation([])
    sessionIdRef.current = ''
    setMicPhase('idle')
    openerFiredRef.current = false
    // Kick off the opener again immediately on the same page.
    if (student) {
      const opener = buildOpener(LEVEL_LABEL[student.level])
      setConversation([{ role: 'assistant', content: opener }])
      openerFiredRef.current = true
      // Small delay so the bubble mounts before TTS begins.
      window.setTimeout(() => speakAiTurn(opener), 200)
    }
  }, [student, speakAiTurn])

  // ── Fire the AI's opening line the first time the chat mounts ────────────
  useEffect(() => {
    if (pageState !== 'chatting') return
    if (!student) return
    if (openerFiredRef.current) return
    openerFiredRef.current = true

    stopSpeaking() // in case the intro TTS was still playing when Start was tapped
    const opener = buildOpener(LEVEL_LABEL[student.level])
    setConversation([{ role: 'assistant', content: opener }])
    const id = window.setTimeout(() => speakAiTurn(opener), 300)
    return () => window.clearTimeout(id)
  }, [pageState, student, speakAiTurn])

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleStart = useCallback(() => {
    // Cut off the intro TTS the instant the student taps Start.
    stopSpeaking()
    setPageState('chatting')
  }, [])

  const handleBack = useCallback(() => {
    stopSpeaking()
    stopPTTRecording().catch(() => {})
    router.push('/kiosk/menu')
  }, [router])

  const orbState: OrbState = useMemo(() => micToOrb(micPhase), [micPhase])
  const latestAssistant = useMemo(() => {
    for (let i = conversation.length - 1; i >= 0; i--) {
      if (conversation[i].role === 'assistant') return conversation[i].content
    }
    return ''
  }, [conversation])

  // ── Loading ───────────────────────────────────────────────────────────────
  if (pageState === 'loading') {
    return (
      <div className="flex items-center justify-center w-full h-full" style={{ background: '#000' }}>
        <ShaderBackdrop />
        <Spinner size="xl" style={{ color: '#34D399', position: 'relative', zIndex: 1 }} />
      </div>
    )
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (pageState === 'error' || (loadError && !student)) {
    return (
      <div
        className="flex flex-col items-center justify-center w-full h-full gap-6 px-8 text-center"
        style={{ background: '#000', color: '#F1F5F9' }}
      >
        <ShaderBackdrop />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
          <div style={{ fontSize: 56, color: '#F59E0B' }}>⚠</div>
          <h2 className="font-display font-semibold" style={{ fontSize: 36 }}>
            {loadError || 'Something went wrong'}
          </h2>
          <button
            onClick={() => router.push('/kiosk/menu')}
            className="font-body"
            style={{
              fontSize: 22, color: '#34D399',
              background: 'none', border: 'none', padding: '16px 28px', cursor: 'pointer',
            }}
          >
            ← Back to menu
          </button>
        </div>
      </div>
    )
  }

  const levelLabel = LEVEL_LABEL[student?.level ?? 'entry-1']
  const firstName  = student?.name.split(' ')[0] ?? ''

  return (
    <div
      data-theme="dark"
      className="flex flex-col w-full h-full relative"
      style={{ background: '#000', overflow: 'hidden' }}
    >
      <ShaderBackdrop />

      {/* ── Intro ───────────────────────────────────────────────────────── */}
      {pageState === 'intro' && student && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 5 }}>
          <VoiceIntro
            studentFirstName={firstName}
            levelLabel={levelLabel}
            onStart={handleStart}
          />
        </div>
      )}

      {/* ── Chat surface (top orb + bottom chat) ────────────────────────── */}
      {pageState === 'chatting' && (
        <>
          {/* Header */}
          <header
            style={{
              position: 'relative', zIndex: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '20px 32px',
              height: 120,
              background: 'rgba(0, 0, 0, 0.35)',
              backdropFilter: 'blur(24px) saturate(160%)',
              WebkitBackdropFilter: 'blur(24px) saturate(160%)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              flexShrink: 0,
            }}
          >
            <div style={{ width: 140 }}></div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div className="font-display" style={{ fontSize: 28, fontWeight: 600, color: '#F1F5F9' }}>
                AI Voice Tutor
              </div>
              <div
                className="font-mono"
                style={{
                  fontSize: 14, letterSpacing: '0.15em', textTransform: 'uppercase',
                  color: '#34D399', opacity: 0.85,
                }}
              >
                {levelLabel}
              </div>
            </div>

            <button
              onClick={handleNewConversation}
              className="font-display"
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                height: 60, padding: '0 24px',
                borderRadius: 14,
                border: '1px solid rgba(255, 255, 255, 0.12)',
                background: 'rgba(255, 255, 255, 0.04)',
                color: '#F1F5F9',
                fontSize: 18, fontWeight: 600,
                cursor: 'pointer',
                transition: 'transform 100ms ease',
                outline: 'none',
              }}
              onPointerDown={(e) => { e.currentTarget.style.transform = 'scale(0.96)' }}
              onPointerUp={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
              onPointerLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
            >
              <RefreshCw size={20} strokeWidth={2.2} />
              New conversation
            </button>
          </header>

          {/* Top half: interactive orb only. The orb's internal SVGs are
              fixed-size, so we scale the wrapper up to visually enlarge it
              without changing the underlying component. */}
          <div
            style={{
              position: 'relative', zIndex: 4,
              flex: '0 0 45%',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              padding: '24px 24px 0',
              minHeight: 0,
            }}
          >
            <div style={{ transform: 'scale(1.6)', transformOrigin: 'center center' }}>
              <VoiceOrb state={orbState} size={360} />
            </div>
          </div>

          {/* Bottom half: chat history + mic */}
          <div
            style={{
              position: 'relative', zIndex: 4,
              flex: 1, minHeight: 0,
              display: 'flex', flexDirection: 'column',
              background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 40%, rgba(0,0,0,0.85) 100%)',
            }}
          >
            <div
              ref={scrollRef}
              style={{
                flex: 1, minHeight: 0, overflowY: 'auto',
                padding: '28px 32px 12px',
                display: 'flex', flexDirection: 'column', gap: 16,
                maxWidth: 1100, width: '100%', margin: '0 auto',
              }}
            >
              {conversation.length === 0 && (
                <div
                  className="font-body"
                  style={{
                    textAlign: 'center', color: '#94A3B8',
                    fontSize: 22, lineHeight: 1.55,
                    padding: '24px 24px',
                  }}
                >
                  Tap the microphone or hold the spacebar when you want to say something.
                </div>
              )}
              {conversation.map((turn, i) => {
                const isLastAssistant =
                  turn.role === 'assistant' &&
                  i === conversation.length - 1 &&
                  micPhase === 'speaking'
                return (
                  <ChatBubble key={i} role={turn.role} text={turn.content} speaking={isLastAssistant} />
                )
              })}
            </div>

            {/* Mic zone */}
            <div
              style={{
                padding: '16px 32px 28px',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                flexShrink: 0,
              }}
            >
              <VoiceMicButton
                phase={micPhase}
                onPress={handleMicPress}
                recordingSeconds={recordingSecs}
              />
            </div>
          </div>

          {/* Toast */}
          {toast && (
            <div
              style={{
                position: 'fixed',
                bottom: 260, left: '50%', transform: 'translateX(-50%)',
                zIndex: 20,
                padding: '14px 26px',
                borderRadius: 14,
                background: 'rgba(239, 68, 68, 0.14)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#FCA5A5',
                fontFamily: 'var(--font-body), sans-serif',
                fontSize: 20,
                maxWidth: '80%',
                textAlign: 'center',
                boxShadow: '0 12px 32px rgba(0, 0, 0, 0.5)',
              }}
            >
              {toast}
            </div>
          )}

          {/* Bottom-left back button */}
          <div style={{ position: 'absolute', bottom: 48, left: 48, zIndex: 50 }}>
            <BlueBackButton label="Back to menu" onClick={handleBack} />
          </div>
        </>
      )}
    </div>
  )
}
