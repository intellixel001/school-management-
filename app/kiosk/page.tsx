'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { gsap, useGSAP, prefersReducedMotion } from '@/lib/gsap'
import { LibraryScene } from './_components/LibraryScene'
import { useTransition } from './_components/TransitionProvider'
import PinModal from './_components/PinModal'
import KioskAuthModal from '@/components/KioskAuthModal'
import { authenticateStudentByPin } from '@/lib/services'
import { useKioskSession } from './_components/KioskSessionProvider'
import { kioskAudio } from '@/lib/kiosk/audio'

// Kiosk sign-in is PIN-only: tapping the idle screen goes straight to the
// keypad. The email step was removed as it was friction on a shared device —
// the student portal still uses email + PIN (see app/student/login).
type PageState = 'idle' | 'entering-pin' | 'authenticating' | 'success' | 'error'

export default function KioskPage() {
  const router = useRouter()
  const { playTransition } = useTransition()
  const { session: kioskSession, setSession: setKioskSession } = useKioskSession()
  const [state, setState] = useState<PageState>('idle')
  const [authError, setAuthError] = useState<string | null>(null)
  const [time, setTime] = useState<string>('')
  const [isKioskAuthRequired, setIsKioskAuthRequired] = useState(false)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const idleRef = useRef<HTMLDivElement>(null)

  // Verify Kiosk PIN authorization on direct page load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isAuthorized = sessionStorage.getItem('kiosk_authorized') === 'true'
      if (!isAuthorized) {
        setIsKioskAuthRequired(true)
      }
    }
  }, [])

  // If a session is already active, go straight to the menu.
  useEffect(() => {
    if (kioskSession) {
      router.replace('/kiosk/menu')
    }
  }, [kioskSession, router])

  // Background music — attempts to start on mount (silent no-op before the
  // first user gesture) and again on every wake tap. Stops fully when the
  // /kiosk page unmounts, so the menu / practice pages stay quiet.
  useEffect(() => {
    kioskAudio.playBg()
    return () => { kioskAudio.stopBg() }
  }, [])

  // Duck bg to 50 % whenever a modal is open (any non-idle state), full volume
  // when the idle screen is showing.
  useEffect(() => {
    kioskAudio.setBgDucked(state !== 'idle')
  }, [state])

  
  // Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setTime(
        now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
      )
    }
    updateTime()
    const interval = setInterval(updateTime, 60000)
    return () => clearInterval(interval)
  }, [])

  // Idle entrance animations
  useGSAP(() => {
    if (!idleRef.current) return

    if (prefersReducedMotion()) {
      gsap.set(['.hero-heading', '.hero-tagline', '.bottom-prompt', '.bottom-footer'], { opacity: 1, y: 0, scale: 1 })
      // Keep touch prompt pulse running even in reduced motion
      gsap.to('.bottom-prompt', {
        opacity: 0.5,
        duration: 1.25,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      })
      return
    }

    const tl = gsap.timeline()
    
    // Set initial states
    gsap.set('.hero-heading', { opacity: 0, scale: 1.06 })
    gsap.set('.hero-tagline', { opacity: 0, y: 16 })
    gsap.set(['.bottom-prompt', '.bottom-footer'], { opacity: 0 })

    // Wordmark scales in
    tl.to('.hero-heading', { opacity: 1, scale: 1.0, duration: 0.9, ease: 'power3.out' }, 1.0)

    // Tagline fades up
    tl.to('.hero-tagline', { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, 1.3)

    // Touch prompt fades in and starts pulse
    tl.to('.bottom-prompt', { opacity: 1, duration: 0.5, ease: 'power2.out' }, 2.0)
    tl.to('.bottom-prompt', {
      opacity: 0.5,
      duration: 1.25,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    }, 2.5) // Starts after it fully fades in

    // Footer fades in
    tl.to('.bottom-footer', { opacity: 1, duration: 0.5, ease: 'power2.out' }, 2.1)

  }, { scope: idleRef })

  const handleWake = () => {
    if (state === 'idle') {
      // First real user gesture — safe to (re)start the bg loop if the mount
      // attempt was blocked by autoplay policy.
      kioskAudio.playBg()
      setState('entering-pin')
    }
  }

  const handleClose = () => {
    setState('idle')
  }

  const handlePinComplete = async (pin: string) => {
    setState('authenticating')
    setAuthError(null)
    try {
      const student = await authenticateStudentByPin(pin)
      setKioskSession({
        studentId: student.id,
        studentName: student.name,
        email: student.email,
        level: student.level,
        startedAt: Date.now(),
      })
      setState('success')
      kioskAudio.playLoginBurst()   // paired with the glitter burst overlay
      handleBurstComplete()
    } catch (err) {
      const raw  = err instanceof Error ? err.message : null
      const code = (err as { code?: string })?.code || ''

      // An unapproved account is not usable on the kiosk. Give it its own
      // wording (the student portal says "log in to your dashboard" instead)
      // and hold it on screen long enough to actually be read.
      const isPending = code === 'ACCOUNT_PENDING'

      // Any "this PIN doesn't match an account" variant from either the backend
      // or the dummy path is surfaced as the same short, friendly phrase.
      // Distinct account states (email not verified, etc.) fall through
      // unchanged so students still see them.
      const wrongPin =
        raw === 'No student found for PIN' ||
        raw === 'Invalid email or PIN' ||
        raw === 'Incorrect PIN' ||
        raw === 'Invalid PIN'

      setAuthError(
        isPending
          ? 'Your account is being reviewed by your teacher. Once your account is approved, you\'ll be able to access and use the kiosk.'
          : wrongPin ? 'Incorrect PIN' : raw
      )
      kioskAudio.playWrongCredentials()
      setState('error')
      setTimeout(() => setState('entering-pin'), isPending ? 6000 : 2400)
    }
  }

  const handleBurstComplete = async () => {
    const burstOrigin = getViewportCenter()
    await playTransition('pin-to-menu', { burstOrigin })
    router.push('/kiosk/menu')
  }

  // Calculate viewport center for the burst
  const getViewportCenter = () => {
    if (typeof window !== 'undefined') {
      return { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    }
    return { x: 500, y: 500 } // fallback
  }

  return (
    <div
      ref={containerRef}
      data-theme="dark"
      className="relative w-screen h-[100dvh] overflow-hidden bg-[var(--bg-base)] text-[var(--text-primary)] select-none"
    >
      {/* ── Layer 0 & 1: Idle Layout & Background ── */}
      <div 
        ref={idleRef}
        className="absolute inset-0 transition-all duration-250 ease-in-out"
        style={{
          filter: state !== 'idle' ? 'blur(4px)' : 'none',
          opacity: state !== 'idle' ? 0.6 : 1,
        }}
        onClick={handleWake}
      >
        <div className="absolute inset-0 z-0">
          <LibraryScene />
        </div>

        {/* Top Micro-element */}
        <div className="absolute top-6 right-8 z-10 font-mono tracking-[var(--tracking-caps)] uppercase" style={{ color: 'rgba(245, 237, 216, 0.6)', fontSize: '20px' }}>
          {time}
        </div>

        {/* Hero Block */}
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none text-center px-6">
          <div className="relative">
            {/* Dark scrim — darkens the bright bookshelf directly behind the title
                so the warm cream wordmark separates from the background. */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none -z-20"
              style={{
                width: '92vw',
                height: '52vw',
                maxWidth: '1100px',
                maxHeight: '620px',
                background: 'radial-gradient(ellipse 60% 50% at center, rgba(12, 6, 16, 0.72) 0%, rgba(12, 6, 16, 0.45) 45%, transparent 72%)',
                filter: 'blur(50px)'
              }}
            />
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none -z-10"
              style={{
                width: '60vw',
                height: '60vw',
                maxWidth: '800px',
                maxHeight: '800px',
                background: 'radial-gradient(circle, rgba(232, 185, 108, 0.12) 0%, transparent 70%)',
                filter: 'blur(80px)'
              }}
            />
            <h1
              className="hero-heading font-display m-0 font-bold tracking-tight text-transparent bg-clip-text pb-2 relative z-10"
              style={{
                fontSize: 'clamp(80px, 11.5vw, 130px)',
                lineHeight: 1.1,
                backgroundImage: 'linear-gradient(to bottom, #FBF3E2, #E4CA95 55%, #A57F3E)',
                filter: 'drop-shadow(0 3px 14px rgba(0, 0, 0, 0.6)) drop-shadow(0 8px 40px rgba(232, 185, 108, 0.28))',
                paddingBottom: '0.1em',
                opacity: 0,
              }}
            >
              English AI Tutor
            </h1>
          </div>
          <p
            className="hero-tagline font-body mt-6 mb-0 uppercase font-semibold"
            style={{
              color: '#FFFFFF',
              fontSize: 'clamp(20px, 3vw, 30px)',
              letterSpacing: '0.25em',
              opacity: 0,
            }}
          >
            AI-powered English practice
          </p>
        </div>

        {/* Bottom Prompt & Footer */}
        <div className="absolute bottom-20 inset-x-0 z-10 flex flex-col items-center gap-8 pointer-events-none">
          <div className="bottom-prompt font-body font-medium flex items-center justify-center" style={{ opacity: 0 }}>
            <span 
              className="px-10 py-5 rounded-full bg-[#1A0F2E]/40 border border-[#E8B96C]/15 text-[#F5EDD8] backdrop-blur-md shadow-[0_0_24px_rgba(232,185,108,0.1)] flex items-center gap-4"
              style={{ fontSize: 28 }}
            >
              <span className="w-4 h-4 rounded-full bg-[#E8B96C] shadow-[0_0_12px_#E8B96C]" />
              Touch anywhere to begin
            </span>
          </div>
          <div className="bottom-footer font-body flex flex-col items-center mt-4" style={{ opacity: 0 }}>
            <span className="tracking-[0.15em] uppercase text-[13px] font-semibold text-[#F5EDD8]/60">
              Developed and Owned by Truedge Digital Ltd
            </span>
            <span className="text-[12px] font-medium text-[#E8B96C]/60 mt-1.5 tracking-wide">
              Funded by NCL and Truedge
            </span>
            <span className="text-[12px] font-medium text-[#E8B96C]/60 mt-1.5 tracking-wide">
              Visit truedgedigital.co.uk for tailor-made AI & smart software solutions
            </span>
          </div>
        </div>
        <span className="absolute bottom-3 right-4 z-10 text-[11px] font-medium text-[#D1D5DB] tracking-wide">
          © {new Date().getFullYear()} Truedge Digital Ltd. All rights reserved.
        </span>
      </div>

      {/* ── Layer 2: PIN Modal — the only sign-in step on the kiosk ── */}
      <PinModal
        isOpen={state === 'entering-pin' || state === 'authenticating' || state === 'error'}
        onClose={handleClose}
        onComplete={handlePinComplete}
        isAuthenticating={state === 'authenticating'}
        hasError={state === 'error'}
        errorMessage={authError ?? undefined}
      />

      {/* ── Layer 3: Kiosk Authorization Modal ── */}
      <KioskAuthModal
        isOpen={isKioskAuthRequired}
        onClose={() => router.push('/')}
        onSuccess={() => setIsKioskAuthRequired(false)}
      />
    </div>
  )
}
