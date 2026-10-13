'use client'

import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import gsap from 'gsap'
import { prefersReducedMotion } from '@/lib/gsap'
import { Spinner } from '@/components/ui'
import { getStudentById } from '@/lib/services'
import { speakText, stopSpeaking } from '@/lib/speechUtils'
import type { Student } from '@/types/platform'
import { LibraryScene } from '../_components/LibraryScene/LibraryScene'
import MenuHeader from './_components/MenuHeader'
import VitrineCard from './_components/VitrineCard'
import ModeInfoRows from './_components/ModeInfoRows'
import { LogOut } from 'lucide-react'
import { MODES_CONFIG } from './_components/modes.config'
import { useKioskSession } from '../_components/KioskSessionProvider'
import { useTransition } from '../_components/TransitionProvider'

type Status = 'loading' | 'ready' | 'error'

export default function KioskMenuPage() {
  const router = useRouter()
  const { session: kioskSession, clear } = useKioskSession()
  const { signalMounted, playTransition } = useTransition()
  const [student, setStudent] = useState<Student | null>(null)
  const [status, setStatus] = useState<Status>('loading')
  const [errorMsg, setErrorMsg] = useState('')
  const [activeModeId, setActiveModeId] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  // Guards the "welcome" TTS greeting so it only fires ONCE per page mount,
  // no matter how many times the ready-effect re-runs.
  const greetedRef = useRef(false)

  // Signal ready only after the menu has real content to show. Fires for
  // ready + error states so entrance-transitions like voice-to-menu and
  // lightpage-to-menu can complete their reveal even on error.
  useEffect(() => {
    if (status === 'loading') return
    const id = requestAnimationFrame(() => signalMounted())
    return () => cancelAnimationFrame(id)
  }, [status, signalMounted])

  useEffect(() => {
    if (!kioskSession) {
      router.replace('/kiosk')
      return
    }
    let cancelled = false
    async function load() {
      try {
        const s = await getStudentById(kioskSession!.studentId)
        if (!cancelled) {
          if (s) {
            setStudent(s)
            setStatus('ready')
          } else {
            setErrorMsg('Student not found')
            setStatus('error')
          }
        }
      } catch {
        if (!cancelled) {
          if (kioskSession?.studentId && kioskSession?.studentName) {
            setStudent({
              id: kioskSession.studentId,
              name: kioskSession.studentName,
              pin: '',
              email: kioskSession.email || '',
              level: kioskSession.level || 'entry-1',
              streak: 0,
              totalPoints: 0,
              completedSessions: 0,
              enrolledDate: '',
              lastActive: new Date().toISOString(),
              status: 'active',
              skills: { reading: 0, writing: 0, speaking: 0, listening: 0 },
              ilpTargets: [],
            })
            setStatus('ready')
          } else {
            setErrorMsg('Failed to load student data')
            setStatus('error')
          }
        }
      }
    }
    load()
    return () => { cancelled = true }
  }, [kioskSession, router])

  // useLayoutEffect (not useEffect) so GSAP's `fromTo` from-state (opacity: 0,
  // y offset, scale) is applied synchronously after commit and BEFORE the next
  // paint. Plain useEffect leaves one frame where the animated targets — the
  // shared MenuHeader, VitrineCard outers, and ModeInfoRows container/rows,
  // none of which pre-declare opacity: 0 in JSX — paint at full opacity, then
  // GSAP snaps them to 0 and animates back in. That single frame is the flash.
  useLayoutEffect(() => {
    if (status !== 'ready' || !containerRef.current) return

    const isReduced = prefersReducedMotion()
    const tl = gsap.timeline()

    const header = containerRef.current.querySelector('.menu-header')
    const title = containerRef.current.querySelector('.menu-title')
    const cards = containerRef.current.querySelectorAll('.vitrine-card')
    const spotlights = containerRef.current.querySelectorAll('.menu-spotlight')
    const rowsContainer = containerRef.current.querySelector('.mode-info-rows-container')
    const rows = containerRef.current.querySelectorAll('.mode-info-row')

    const greetingEl = containerRef.current.querySelector('.menu-greeting')

    if (isReduced) {
      gsap.set([header, greetingEl, title, cards, rowsContainer, rows], {
        opacity: 1,
        y: 0,
        scale: 1,
      })
      gsap.set(spotlights, { opacity: 0.5 })
      return
    }

    const firstName = student?.name ? student.name.split(' ')[0] : ''
    const greetingText = 'Welcome back'

    tl.fromTo(header, 
      { opacity: 0, y: -16 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' },
      0
    )
    
    // Typewriting effect for greeting
    tl.to(greetingEl, { opacity: 1, duration: 0.1 }, 0.3)
    tl.fromTo(greetingEl,
      { text: "" },
      { text: greetingText, duration: 1.0, ease: "none" },
      0.3
    )

    // Typewriting effect for title
    tl.to(title, { opacity: 1, duration: 0.1 }, 1.3)
    tl.fromTo(title,
      { text: "" },
      { text: "Choose your training", duration: 1.2, ease: "none" },
      1.3
    )

    tl.fromTo(cards,
      { opacity: 0, y: 40, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'power3.out', stagger: 0.15 },
      1.7
    )
    tl.fromTo(spotlights,
      { opacity: 0 },
      { opacity: 0.5, duration: 0.8, stagger: 0.15 },
      2.1
    )
    tl.fromTo(rowsContainer, { opacity: 0 }, { opacity: 1, duration: 0.1 }, 2.4)
    tl.fromTo(rows,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', stagger: 0.1 },
      2.4
    )

    return () => {
      tl.kill()
    }
  }, [status, student])

  // ── AI-tutor voice greeting ─────────────────────────────────────────────────
  //
  // Speaks a short welcome once the page is ready and we have a student name.
  // Guarded by greetedRef so it can't retrigger on re-renders. Any pending
  // speech is cancelled on unmount so navigating to a card doesn't leave the
  // greeting echoing on the next screen.
  useEffect(() => {
    if (status !== 'ready' || !student || greetedRef.current) return
    greetedRef.current = true

    // Deliberately impersonal — the greeting stays generic so the same phrase
    // works for any student on the kiosk without the TTS mispronouncing names.
    const line = 'Welcome back. Choose your training.'

    // Slight delay so the entrance animation finishes first — otherwise the
    // voice starts before the cards have visually landed.
    const id = window.setTimeout(() => speakText(line), 700)

    return () => {
      window.clearTimeout(id)
      stopSpeaking()
    }
  }, [status, student])

  return (
    <div
      data-theme="dark"
      className="relative w-screen h-[100dvh] overflow-hidden bg-[var(--bg-base)]"
      ref={containerRef}
    >
      <LibraryScene showProps={false} showParticles={false} />
      
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <Spinner size="lg" color="#E8B96C" />
        </div>
      )}

      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-8 text-center z-20">
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 'var(--radius-full)',
              background: 'color-mix(in srgb, var(--accent-danger) 10%, transparent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
            }}
          >
            ⚠
          </div>
          <h2 className="font-display font-semibold" style={{ fontSize: 24, color: 'var(--text-primary)' }}>
            {errorMsg}
          </h2>
          <button
            onClick={() => {
              clear()
              router.replace('/kiosk')
            }}
            onPointerDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.94)'
              e.currentTarget.style.background = 'color-mix(in srgb, var(--accent-danger) 12%, transparent)'
            }}
            onPointerUp={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'
            }}
            onPointerLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              padding: '0 34px',
              height: 71,
              borderRadius: 15,
              border: '1px solid color-mix(in srgb, var(--accent-danger) 30%, transparent)',
              color: 'var(--accent-danger)',
              background: 'rgba(255, 255, 255, 0.04)',
              cursor: 'pointer',
              transition: 'transform 100ms ease, background 100ms ease',
              outline: 'none',
            }}
          >
            <LogOut size={26} />
            <span className="font-display font-bold text-white" style={{ fontSize: 24 }}>Return to Login</span>
          </button>
        </div>
      )}

      {status === 'ready' && student && (
        <>
          <MenuHeader student={student} hideWelcomePrefix={true} />
          <main className="absolute inset-0 flex flex-col items-center justify-center z-10 w-full px-8 lg:px-16 pt-[136px]">
            <div className="flex flex-col items-center mb-[56px] text-center" style={{ filter: 'drop-shadow(0 3px 14px rgba(0,0,0,0.6)) drop-shadow(0 8px 40px rgba(232,185,108,0.28))' }}>
              <div 
                className="menu-greeting font-mono"
                style={{
                  fontSize: 26,
                  color: 'rgba(245, 237, 216, 0.85)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.15em',
                  marginBottom: 16,
                  fontWeight: 600,
                  opacity: 0
                }}
              >
                Welcome back
              </div>
              <h1
                className="menu-title font-display m-0 font-bold tracking-tight text-transparent bg-clip-text text-center"
                style={{
                  background: 'linear-gradient(to bottom, #FFFFFF, #F3D9A5 55%, #B88E45)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  // Title fits on one line at 1080px (clamp evaluates to ~70px)
                  fontSize: 'clamp(48px, 6.5vw, 76px)',
                  lineHeight: 'var(--leading-display)',
                  paddingBottom: '0.1em',
                  opacity: 0
                }}
              >
                Choose your training
              </h1>
            </div>
            <div
              className="flex w-full justify-center flex-wrap md:flex-nowrap"
              style={{ gap: 'clamp(28px, 3.2vw, 56px)', marginBottom: 48 }}
            >
              {MODES_CONFIG.map((config) => (
                <VitrineCard
                  key={config.id}
                  config={config}
                  isActive={activeModeId === config.id}
                  onPointerDown={() => setActiveModeId(config.id)}
                  onPointerUp={() => setActiveModeId(null)}
                  onTap={async (rect, el) => {
                    // Pass the card element itself — the overlay deep-clones this
                    // node as the flying ghost, so anything larger (e.g. document.body)
                    // duplicates the whole page on screen mid-transition.
                    await playTransition(
                      config.transitionKind,
                      { sourceRect: rect, accentColor: config.accent },
                      el ?? undefined
                    )
                    router.push(config.href)
                  }}
                />
              ))}
            </div>
            <ModeInfoRows
              activeModeId={activeModeId}
              setActiveModeId={setActiveModeId}
              onStartTransition={async (modeId, accentColor, rect, el) => {
                const config = MODES_CONFIG.find(m => m.id === modeId)
                if (!config) return
                await playTransition(
                  config.transitionKind,
                  { sourceRect: rect, accentColor },
                  el ?? undefined
                )
                router.push(config.href)
              }}
            />
          </main>
        </>
      )}
    </div>
  )
}
