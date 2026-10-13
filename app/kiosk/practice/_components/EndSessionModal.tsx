'use client'

/**
 * @file app/kiosk/practice/_components/EndSessionModal.tsx
 * @description Custom end-session confirmation for practice sessions.
 * Replaces the raw window.confirm() call so kiosk styling stays consistent
 * and touch targets are big enough for finger use.
 *
 * Mirrors LogoutModal's overall shape but with a warning triangle + neutral
 * cream background because practice pages are light-themed.
 */

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle } from 'lucide-react'
import gsap from 'gsap'

interface EndSessionModalProps {
  isOpen: boolean
  onCancel: () => void
  onConfirm: () => void
  /** Optional per-skill accent for the confirm button. Defaults to danger red. */
  accentColor?: string
}

export default function EndSessionModal({
  isOpen,
  onCancel,
  onConfirm,
  accentColor,
}: EndSessionModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null)
  const cardRef     = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!isOpen || !mounted) return
    gsap.fromTo(backdropRef.current, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'power2.out' })
    gsap.fromTo(
      cardRef.current,
      { opacity: 0, scale: 0.95, y: 12 },
      { opacity: 1, scale: 1, y: 0, duration: 0.35, ease: 'back.out(1.2)' }
    )
  }, [isOpen, mounted])

  const closeThen = (cb: () => void) => {
    gsap.to(cardRef.current,     { opacity: 0, scale: 0.98, y: -6, duration: 0.15, ease: 'power2.in' })
    gsap.to(backdropRef.current, { opacity: 0, duration: 0.2,  ease: 'power2.inOut', onComplete: cb })
  }

  if (!isOpen || !mounted) return null

  const confirmBg = accentColor ?? '#EF4444'

  return createPortal(
    <div
      ref={backdropRef}
      onClick={() => closeThen(onCancel)}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(12px) saturate(140%)',
        WebkitBackdropFilter: 'blur(12px) saturate(140%)',
        padding: 24,
      }}
    >
      <div
        ref={cardRef}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 560,
          background: '#FFFFFF',
          border: '1px solid rgba(15, 23, 42, 0.08)',
          borderRadius: 28,
          boxShadow: '0 32px 80px rgba(15, 23, 42, 0.35)',
          padding: 48,
          textAlign: 'center',
          color: '#1A1A1A',
        }}
      >
        <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'center' }}>
          <div
            style={{
              width: 96, height: 96, borderRadius: '50%',
              background: 'rgba(245, 158, 11, 0.14)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 40px rgba(245, 158, 11, 0.18)',
            }}
          >
            <AlertTriangle size={52} color="#D97706" strokeWidth={2.2} />
          </div>
        </div>

        <h2 className="font-display font-bold" style={{ fontSize: 36, margin: 0, marginBottom: 12 }}>
          End this session?
        </h2>
        <p
          className="font-body"
          style={{ fontSize: 20, color: '#555', margin: 0, marginBottom: 40, lineHeight: 1.5 }}
        >
          Your progress won&apos;t be saved and no points will be awarded.
        </p>

        <div style={{ display: 'flex', gap: 16 }}>
          <button
            onClick={() => closeThen(onCancel)}
            className="font-display font-bold active:scale-[0.97]"
            style={{
              flex: 1, height: 76, fontSize: 22, borderRadius: 18,
              background: 'rgba(15, 23, 42, 0.06)', color: '#1A1A1A',
              border: 'none', cursor: 'pointer', transition: 'transform 0.1s',
            }}
          >
            Keep going
          </button>
          <button
            onClick={() => closeThen(onConfirm)}
            className="font-display font-bold active:scale-[0.97]"
            style={{
              flex: 1, height: 76, fontSize: 22, borderRadius: 18,
              background: confirmBg, color: '#FFFFFF',
              border: 'none', cursor: 'pointer', transition: 'transform 0.1s',
              boxShadow: `0 10px 24px ${confirmBg}40`,
            }}
          >
            End session
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
