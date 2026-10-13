'use client'

import { useState, useEffect, useRef } from 'react'
import { gsap, useGSAP, prefersReducedMotion } from '@/lib/gsap'
import { getStudentByEmail } from '@/lib/services'
import { INPUT_LIMITS, sanitizeIdentityField } from '@/lib/security/inputLimits'

interface EmailModalProps {
  isOpen: boolean
  /** Pre-fills the input if the student is returning from Step 2's "change email" link. */
  initialEmail?: string
  /** Closes back to idle (tap outside backdrop or × button). */
  onClose: () => void
  /** Called when student submits a valid email that exists in the system. */
  onEmailValidated: (email: string) => void
  /** Called when the inactivity timer fires. */
  onInactivityTimeout: () => void
}

const TIMEOUT_MS = 60_000

export default function EmailModal({
  isOpen,
  initialEmail = '',
  onClose,
  onEmailValidated,
  onInactivityTimeout,
}: EmailModalProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const tlRef = useRef<gsap.core.Timeline | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [email, setEmail] = useState(initialEmail)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ── Sync initialEmail into input when the modal re-opens with a pre-fill
  // (e.g. returning from "change email"). Runs ONLY when isOpen transitions
  // to true so we don't clobber a student mid-type on a re-render.
  useEffect(() => {
    if (isOpen) {
      setEmail(initialEmail)
    }
  }, [isOpen, initialEmail])

  // ── Reset transient state synchronously when modal closes — separate effect,
  // never inside the GSAP block (same pattern as PinModal).
  useEffect(() => {
    if (!isOpen) {
      setError('')
      setIsSubmitting(false)
      // Do NOT reset email here — we need it preserved for "change email" pre-fill.
      // email is reset by page.tsx when navigating fully back to idle.
    }
  }, [isOpen])

  // ── Body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // ── Inactivity timer — resets on any key press or pointer activity
  useEffect(() => {
    if (!isOpen) return

    let timer = setTimeout(onInactivityTimeout, TIMEOUT_MS)

    function resetTimer() {
      clearTimeout(timer)
      timer = setTimeout(onInactivityTimeout, TIMEOUT_MS)
    }

    const events = ['keydown', 'pointerdown', 'pointermove'] as const
    const el = containerRef.current
    events.forEach(ev => el?.addEventListener(ev, resetTimer))

    return () => {
      clearTimeout(timer)
      events.forEach(ev => el?.removeEventListener(ev, resetTimer))
    }
  }, [isOpen, onInactivityTimeout])

  // ── GSAP Entrance / Exit Timeline (Phase 4 robust patterns)
  useGSAP(() => {
    if (!containerRef.current) return

    if (prefersReducedMotion()) {
      gsap.set(containerRef.current, { display: isOpen ? 'flex' : 'none' })
      gsap.set('.email-modal-backdrop', { opacity: isOpen ? 1 : 0 })
      gsap.set('.email-modal-shell', { opacity: isOpen ? 1 : 0, scale: 1, y: 0 })
      gsap.set('.email-modal-content', { opacity: isOpen ? 1 : 0 })
      return
    }

    // Build the timeline ONCE, cache in tlRef.
    if (!tlRef.current) {
      const tl = gsap.timeline({ paused: true })

      tl.to('.email-modal-backdrop', { opacity: 1, duration: 0.25, ease: 'none' }, 0)

      tl.fromTo(
        '.email-modal-shell',
        { scale: 0.92, opacity: 0, y: 24 },
        { scale: 1, opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' },
        0.1
      )

      tl.fromTo(
        '.email-modal-content',
        { opacity: 0 },
        { opacity: 1, duration: 0.25, ease: 'power2.out' },
        0.3
      )

      // Attach "set display:none" on reverse-complete here, at creation time.
      // Do NOT use .then() on reverse() — stale closures.
      tl.eventCallback('onReverseComplete', () => {
        if (containerRef.current) {
          gsap.set(containerRef.current, { display: 'none' })
        }
      })

      // GSAP owns display — JSX static style={{ display:'none' }} is the starting state.
      gsap.set(containerRef.current, { display: 'none' })
      tlRef.current = tl
    }

    // Kill in-flight ad-hoc tweens (button press scale only) before changing
    // direction. CRITICAL: do NOT kill scale/opacity/y on .email-modal-shell —
    // those ARE the master timeline's child tweens. Killing them blanks the
    // shell. GSAP's play()/reverse() already handles direction interruption
    // on the master timeline cleanly.
    const c = containerRef.current
    gsap.killTweensOf(c.querySelector('.email-continue-btn'), 'scale')

    if (isOpen) {
      gsap.set(containerRef.current, { display: 'flex' })
      tlRef.current.timeScale(1).play()
    } else {
      tlRef.current.timeScale(1.6).reverse()
    }
  }, { scope: containerRef, dependencies: [isOpen] })

  // ── Submit handler
  async function handleSubmit() {
    setError('')
    const trimmed = email.trim().toLowerCase()

    if (!trimmed) {
      setError('Please enter your email')
      return
    }

    // 2. Existence check via service
    setIsSubmitting(true)
    try {
      const student = await getStudentByEmail(trimmed)
      if (!student) {
        setError('Email not found. Please check or ask staff.')
        setIsSubmitting(false)
        return
      }
      // 3. Success — advance to Step 2
      setIsSubmitting(false)
      onEmailValidated(trimmed)
    } catch {
      setError('Connection error. Please try again.')
      setIsSubmitting(false)
    }
  }

  // Allow Enter key to submit
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      handleSubmit()
    }
  }

  // Continue button press animation (no hover — kiosk rule)
  function handleContinuePress() {
    const btn = containerRef.current?.querySelector('.email-continue-btn')
    if (!btn || prefersReducedMotion()) return
    gsap.killTweensOf(btn)
    gsap.to(btn, {
      scale: 0.96,
      duration: 0.08,
      ease: 'power2.out',
      onComplete: () => {
        gsap.to(btn, { scale: 1, duration: 0.15, ease: 'power2.out' })
      },
    })
  }

  const hasValue = email.trim().length > 0

  // Palette — kept local to this modal so the warm library aesthetic doesn't
  // require touching the global design tokens (which are cold-navy defaults).
  const CREAM = '#F5EDD8'
  const CREAM_DIM = 'rgba(245, 237, 216, 0.6)'
  const CREAM_FAINT = 'rgba(245, 237, 216, 0.32)'
  const AMBER = '#E8B96C'
  const AMBER_DEEP = '#C9782E'
  const BRASS_HAIRLINE = 'rgba(198, 158, 92, 0.32)'
  const PANEL_BG = 'rgba(30, 18, 13, 0.92)'
  const INPUT_BG = 'rgba(15, 8, 12, 0.65)'
  const ERROR_WARM = '#E4736A' // sits in the oxblood family, still unmistakably an error

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 items-center justify-center"
      style={{ display: 'none' }}
    >
      {/* Backdrop — warm dark tint so it doesn't jarringly cool the scene */}
      <div
        className="email-modal-backdrop absolute inset-0 opacity-0"
        style={{
          background: 'rgba(12, 7, 16, 0.72)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
        }}
        onClick={onClose}
      />

      {/* Modal Shell — warm dark panel with brass hairline (matches vitrine framing) */}
      <div
        className="email-modal-shell relative z-[51] w-full max-w-[640px] min-h-[620px] flex flex-col justify-center px-16 py-16 opacity-0"
        style={{
          background: PANEL_BG,
          border: `1px solid ${BRASS_HAIRLINE}`,
          borderRadius: 14,
          boxShadow:
            '0 24px 70px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 230, 180, 0.14)',
        }}
      >
        {/* Close button — brass, matches the plaques */}
        <button
          onClick={onClose}
          className="absolute top-8 right-8 flex items-center justify-center transition-transform"
          style={{
            width: 64,
            height: 64,
            borderRadius: 10,
            cursor: 'default',
            color: '#2E2310',
            background: 'linear-gradient(180deg, #C9A557 0%, #8A6D34 100%)',
            border: `1px solid rgba(255, 233, 180, 0.28)`,
            boxShadow:
              'inset 0 1px 0 rgba(255,245,214,0.35), 0 4px 14px rgba(0,0,0,0.4)',
          }}
          onPointerDown={(e) => {
            e.currentTarget.style.transform = 'scale(0.96)'
          }}
          onPointerUp={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
          }}
          onPointerLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
          }}
          aria-label="Close"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Header — warm cream gradient title, matches wordmark treatment */}
        <div className="email-modal-content text-center mb-10">
          <h2
            className="font-display m-0 leading-tight text-transparent bg-clip-text"
            style={{
              fontSize: 40,
              fontWeight: 700,
              backgroundImage: 'linear-gradient(to bottom, #FBF3E2, #E4CA95 55%, #A57F3E)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.4))',
            }}
          >
            Enter your email
          </h2>
          <p
            className="font-body mt-3 m-0"
            style={{ fontSize: 18, color: CREAM_DIM }}
          >
            Sign in to continue
          </p>
        </div>

        {/* Email Input */}
        <div className="email-modal-content">
          <input
            ref={inputRef}
            type="email"
            autoFocus
            autoComplete="email"
            inputMode="email"
            placeholder="Write your email here"
            value={email}
            maxLength={INPUT_LIMITS.EMAIL}
            onChange={(e) => {
              setEmail(sanitizeIdentityField(e.target.value, INPUT_LIMITS.EMAIL))
              if (error) setError('')
            }}
            onKeyDown={handleKeyDown}
            style={{
              width: '100%',
              padding: '24px 32px',
              background: INPUT_BG,
              border: `2px solid ${error ? ERROR_WARM : BRASS_HAIRLINE}`,
              borderRadius: 10,
              fontFamily: 'var(--font-body)',
              fontSize: 24,
              fontWeight: 500,
              color: CREAM,
              outline: 'none',
              transition: 'border-color 200ms, box-shadow 200ms',
              boxSizing: 'border-box',
              caretColor: AMBER,
            }}
            onFocus={(e) => {
              if (!error) {
                e.currentTarget.style.borderColor = AMBER
                e.currentTarget.style.boxShadow = `0 0 0 4px rgba(232, 185, 108, 0.14)`
              }
            }}
            onBlur={(e) => {
              if (!error) {
                e.currentTarget.style.borderColor = BRASS_HAIRLINE
                e.currentTarget.style.boxShadow = 'none'
              }
            }}
          />

          {/* Error message slot — kept as a reserved-height row so layout doesn't jump */}
          <p
            style={{
              marginTop: 14,
              marginBottom: 0,
              minHeight: 28,
              color: ERROR_WARM,
              fontSize: 18,
              fontWeight: 500,
              fontFamily: 'var(--font-body)',
            }}
          >
            {error}
          </p>
        </div>

        {/* Continue button — amber gradient */}
        <button
          className="email-continue-btn email-modal-content"
          onPointerDown={() => {
            if (!isSubmitting && hasValue) handleContinuePress()
          }}
          onClick={() => {
            if (!isSubmitting && hasValue) handleSubmit()
          }}
          disabled={isSubmitting || !hasValue}
          style={{
            width: '100%',
            marginTop: 32,
            height: 96,
            // Always show the active amber gradient — the empty state used to
            // render as a flat dark bar, which read as "the modal is broken".
            // Empty submissions are still prevented by the onClick guard.
            background: `linear-gradient(180deg, ${AMBER} 0%, ${AMBER_DEEP} 100%)`,
            color: '#1A0F07',
            fontFamily: 'var(--font-display)',
            fontSize: 26,
            fontWeight: 700,
            letterSpacing: '0.02em',
            borderRadius: 10,
            boxShadow: '0 10px 28px rgba(232, 185, 108, 0.32), inset 0 1px 0 rgba(255, 245, 214, 0.35)',
            border: '1px solid rgba(255, 233, 180, 0.28)',
            cursor: 'default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            // Only sublty dim when submitting to give visual feedback.
            opacity: isSubmitting ? 0.7 : 1,
            transition: 'opacity 200ms',
          }}
        >
          {isSubmitting ? (
            <>
              <Spinner />
              Checking…
            </>
          ) : (
            'Continue'
          )}
        </button>
      </div>
    </div>
  )
}

// ── Inline spinner — avoids importing the shared Spinner which may carry
// unexpected styles. Matches the visual weight of the Continue button text.
function Spinner() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      style={{ animation: 'email-modal-spin 0.75s linear infinite', flexShrink: 0 }}
    >
      <style>{`
        @keyframes email-modal-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  )
}
