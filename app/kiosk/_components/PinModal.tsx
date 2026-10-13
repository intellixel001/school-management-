'use client'

import { useState, useEffect, useRef } from 'react'
import { gsap, useGSAP, prefersReducedMotion } from '@/lib/gsap'
import { Spinner } from '@/components/ui'
import { kioskAudio } from '@/lib/kiosk/audio'

interface PinModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (pin: string) => void
  isAuthenticating: boolean
  hasError: boolean
  /** Optional friendly error message shown below the PIN dots (e.g. account pending approval). */
  errorMessage?: string
}

const BUTTONS = [
  '1', '2', '3',
  '4', '5', '6',
  '7', '8', '9',
  '⌫', '0', '✗'
]

export default function PinModal({
  isOpen,
  onClose,
  onComplete,
  isAuthenticating,
  hasError,
  errorMessage,
}: PinModalProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const tlRef = useRef<gsap.core.Timeline | null>(null)
  const [pin, setPin] = useState('')

  // Body scroll lock
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

  // Always reset PIN synchronously when the modal closes — never inside an
  // animation callback, otherwise rapid reopen sees stale state.
  useEffect(() => {
    if (!isOpen) setPin('')
  }, [isOpen])

  // Auto-close after inactivity so a student who wandered off doesn't leave
  // the PIN modal open on the kiosk. Any keypad interaction resets the timer.
  const INACTIVITY_MS = 5 * 60 * 1000
  const [activityTick, setActivityTick] = useState(0)

  useEffect(() => {
    if (!isOpen || isAuthenticating) return
    const id = setTimeout(() => onClose(), INACTIVITY_MS)
    return () => clearTimeout(id)
  }, [isOpen, isAuthenticating, activityTick, onClose])

  // Keypad logic — visual dot state is purely React-owned (see the dot render
  // block below). No GSAP mutation of dot styles, so filled/active/error stays
  // in perfect sync with `pin.length` and never gets stranded after a reset.
  const handlePress = (btn: string) => {
    if (isAuthenticating || hasError) return
    setActivityTick(t => t + 1)  // reset inactivity timer

    if (btn === '⌫') {
      // Only beep if there was actually something to delete.
      if (pin.length > 0) kioskAudio.playRemoveBeep()
      setPin(prev => prev.slice(0, -1))
    } else if (btn === '✗') {
      setPin('')
    } else if (pin.length < 6) {
      kioskAudio.playKeypadBeep()
      const newPin = pin + btn
      setPin(newPin)
      if (newPin.length === 6) {
        onComplete(newPin)
      }
    }
  }

  // Keyboard support (for dev)
  useEffect(() => {
    if (!isOpen || isAuthenticating || hasError) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handlePress(e.key)
      } else if (e.key === 'Backspace') {
        handlePress('⌫')
      } else if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, pin, isAuthenticating, hasError, onClose])

  // GSAP Entrance/Exit Timeline
  useGSAP(() => {
    if (!containerRef.current) return

    if (prefersReducedMotion()) {
      gsap.set(containerRef.current, { display: isOpen ? 'flex' : 'none' })
      gsap.set('.modal-backdrop', { opacity: isOpen ? 1 : 0 })
      gsap.set('.modal-shell', { opacity: isOpen ? 1 : 0, scale: 1, y: 0 })
      gsap.set('.keypad-btn', { opacity: 1 })
      return
    }

    // One-time timeline build with a stable onReverseComplete handler so it
    // survives reuse and never captures a stale isOpen.
    if (!tlRef.current) {
      const tl = gsap.timeline({ paused: true })

      tl.to('.modal-backdrop', { opacity: 1, duration: 0.25, ease: 'none' }, 0)

      tl.fromTo('.modal-shell',
        { scale: 0.92, opacity: 0, y: 24 },
        { scale: 1, opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' },
        0.1
      )

      tl.fromTo('.keypad-btn',
        { opacity: 0 },
        { opacity: 1, duration: 0.2, stagger: 0.03, ease: 'power2.out' },
        0.45
      )

      tl.eventCallback('onReverseComplete', () => {
        if (containerRef.current) {
          gsap.set(containerRef.current, { display: 'none' })
        }
      })

      // Start hidden — JSX no longer controls display, GSAP owns it.
      gsap.set(containerRef.current, { display: 'none' })
      tlRef.current = tl
    }

    // Kill only the tweens we still own — keypad press feedback + the shell shake.
    // The PIN dots are now driven by React + CSS and never touched by GSAP.
    const c = containerRef.current
    gsap.killTweensOf(c.querySelectorAll('.keypad-btn'), 'scale,backgroundColor,boxShadow')
    gsap.killTweensOf(c.querySelector('.modal-shell'), 'x')

    if (isOpen) {
      gsap.set(containerRef.current, { display: 'flex' })
      tlRef.current.timeScale(1).play()
    } else {
      tlRef.current.timeScale(1.6).reverse()
    }
  }, { scope: containerRef, dependencies: [isOpen] })

  // Error shake — animates ONLY the shell (x offset). Dot colours are handled
  // by the isError CSS class below so they never fight with GSAP inline props.
  useGSAP(() => {
    if (!hasError) return
    if (prefersReducedMotion()) return
    const shell = containerRef.current?.querySelector('.modal-shell')
    if (!shell) return
    gsap.killTweensOf(shell)
    gsap.to(shell, {
      x: -8,
      duration: 0.1,
      yoyo: true,
      repeat: 3,
      ease: 'sine.inOut',
      onComplete: () => gsap.set(shell, { x: 0 })
    })
  }, { scope: containerRef, dependencies: [hasError] })

  // When an error fires, clear the PIN after the shake so the dots visibly reset.
  // Timing matches the previous behaviour (~600 ms) so users see the red flash
  // before the input empties.
  useEffect(() => {
    if (!hasError) return
    const id = setTimeout(() => setPin(''), 600)
    return () => clearTimeout(id)
  }, [hasError])

  // Keypad press animation handler — warm palette to match the library theme.
  const animatePress = (e: React.PointerEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget
    if (prefersReducedMotion()) return
    gsap.killTweensOf(btn)
    gsap.to(btn, {
      scale: 0.95,
      backgroundColor: 'rgba(232, 185, 108, 0.16)',
      boxShadow: '0 0 0 4px rgba(232, 185, 108, 0.22)',
      duration: 0.1,
      ease: 'power2.out',
      onComplete: () => {
        gsap.to(btn, {
          scale: 1,
          backgroundColor: 'rgba(15, 8, 12, 0.65)',
          boxShadow: 'none',
          duration: 0.2,
          ease: 'power2.out'
        })
      }
    })
  }

  // Active-dot pulse is a pure CSS animation (see the style block in the render).
  // Nothing to run in JS — the `is-active` class handles it.

  // Palette — kept local to this modal so the warm library aesthetic doesn't
  // require touching the global design tokens (which are cold-navy defaults).
  const CREAM = '#F5EDD8'
  const CREAM_DIM = 'rgba(245, 237, 216, 0.6)'
  const AMBER = '#E8B96C'
  const BRASS_HAIRLINE = 'rgba(198, 158, 92, 0.32)'
  const PANEL_BG = 'rgba(30, 18, 13, 0.92)'
  const INK = '#1A0F07' // spinner colour on top of the amber-filled dots

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 items-center justify-center"
      style={{ display: 'none' }}
    >
      {/* Backdrop — warm dark tint (matches EmailModal) */}
      <div
        className="modal-backdrop absolute inset-0 opacity-0"
        style={{
          background: 'rgba(12, 7, 16, 0.72)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
        }}
        onClick={onClose}
      />

      {/* Modal Shell — warm dark panel with brass hairline */}
      <div
        className="modal-shell relative z-10 w-full max-w-[640px] min-h-[760px] flex flex-col justify-center px-16 py-16 opacity-0"
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
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {/* Header — warm cream gradient title */}
        <div className="text-center mb-10">
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
            Enter your PIN
          </h2>
          <p
            className="font-body mt-3 m-0"
            style={{ fontSize: 18, color: CREAM_DIM }}
          >
            6-digit code from your email
          </p>
        </div>

        {/* PIN dots — visual state is React-derived, transitions are CSS. */}
        <div className="pin-dot-row flex justify-center gap-6 mb-12">
          {Array.from({ length: 6 }).map((_, i) => {
            const isFilled = i < pin.length
            const isActive = i === pin.length && !isAuthenticating && !hasError && pin.length < 6

            const classes = [
              'pin-dot',
              `pin-dot-${i}`,
              isFilled       ? 'is-filled'  : '',
              isActive       ? 'is-active'  : '',
              hasError       ? 'is-error'   : '',
              isAuthenticating ? 'is-auth'  : '',
            ].filter(Boolean).join(' ')

            return (
              <div key={i} className={classes}>
                {/* Ink-dark spinner so it stays visible against the amber-filled dot */}
                {isAuthenticating && <Spinner size="md" color={INK} />}
              </div>
            )
          })}
        </div>

        {/* Scoped styles for the dots — warm palette. */}
        <style>{`
          .pin-dot {
            width: 80px;
            height: 80px;
            border-radius: 9999px;
            border: 3px solid rgba(198, 158, 92, 0.32);
            background-color: rgba(15, 8, 12, 0.4);
            box-shadow: none;
            display: flex;
            align-items: center;
            justify-content: center;
            transition:
              border-color 200ms ease,
              background-color 200ms ease,
              box-shadow 200ms ease;
          }
          .pin-dot.is-filled {
            border-color: #E8B96C;
            background-color: #E8B96C;
            box-shadow: 0 0 24px rgba(232, 185, 108, 0.55);
          }
          .pin-dot.is-active {
            border-color: #E8B96C;
            animation: pin-dot-pulse 1.5s ease-in-out infinite;
          }
          .pin-dot.is-error,
          .pin-dot.is-error.is-filled {
            border-color: #E4736A;
            background-color: #E4736A;
            box-shadow: 0 0 24px rgba(228, 115, 106, 0.4);
            animation: none;
          }
          .pin-dot.is-auth {
            /* Preserve the filled look while showing the spinner; no pulse. */
            animation: none;
          }
          @keyframes pin-dot-pulse {
            0%, 100% { border-color: #E8B96C; }
            50%      { border-color: rgba(198, 158, 92, 0.32); }
          }
          @media (prefers-reduced-motion: reduce) {
            .pin-dot { transition: none; }
            .pin-dot.is-active { animation: none; }
          }
        `}</style>

        {/* Error message (e.g. account pending approval) */}
        {hasError && errorMessage && (
          <div style={{
            marginTop: -8, marginBottom: 16, padding: '12px 18px',
            background: 'rgba(228, 115, 106, 0.10)',
            border: '1px solid rgba(228, 115, 106, 0.28)',
            borderRadius: 10, fontSize: 18, color: '#E4736A',
            textAlign: 'center', lineHeight: 1.5,
          }}>
            {errorMessage}
          </div>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-5">
          {BUTTONS.map((btn, i) => {
            const isDisabled = (btn === '⌫' || btn === '✗') && pin.length === 0

            return (
              <button
                key={i}
                className={`keypad-btn flex items-center justify-center h-[110px] font-display select-none ${isDisabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
                style={{
                  background: 'rgba(15, 8, 12, 0.65)',
                  border: `1px solid ${BRASS_HAIRLINE}`,
                  borderRadius: 10,
                  fontSize: 40,
                  color: CREAM,
                }}
                onPointerDown={(e) => {
                  if (!isDisabled) {
                    animatePress(e)
                    handlePress(btn)
                  }
                }}
                disabled={isDisabled || isAuthenticating || hasError}
              >
                {btn === '⌫' ? (
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"></path>
                    <line x1="18" y1="9" x2="12" y2="15"></line>
                    <line x1="12" y1="9" x2="18" y2="15"></line>
                  </svg>
                ) : btn}
              </button>
            )
          })}
        </div>

        {/* Helper line — replaces the old "Change email" link. There is no
            self-service PIN recovery: PINs are issued once by email, so the
            only route back is a member of staff. */}
        <p
          style={{
            marginTop: 28,
            marginBottom: 0,
            color: CREAM_DIM,
            fontFamily: 'var(--font-body)',
            fontSize: 19,
            fontWeight: 500,
            textAlign: 'center',
          }}
        >
          Forgotten your PIN? Please check your email we've sent while creating your account!
        </p>

      </div>
    </div>
  )
}
