'use client'

import { useState, useRef, useEffect } from 'react'
import { ArrowLeft, LogOut, Mic } from 'lucide-react'
import { useRouter } from 'next/navigation'
import gsap from 'gsap'
import { prefersReducedMotion } from '@/lib/gsap'
import { useTransition } from '../../_components/TransitionProvider'
import { useKioskSession } from '../../_components/KioskSessionProvider'

interface VoiceHeaderProps {
  pageState: string
  levelLabel: string
  orbStateColor: string
  onEndConversation: () => void
}

export default function VoiceHeader({ pageState, levelLabel, orbStateColor, onEndConversation }: VoiceHeaderProps) {
  const router = useRouter()
  const { playTransition } = useTransition()
  const { clear } = useKioskSession()
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  const modalBackdropRef = useRef<HTMLDivElement>(null)
  const modalCardRef = useRef<HTMLDivElement>(null)
  const modalTimeline = useRef<gsap.core.Timeline | null>(null)

  const handlePointerDownGhost = (e: React.PointerEvent<HTMLButtonElement>) => {
    gsap.to(e.currentTarget, { scale: 0.96, backgroundColor: 'rgba(255,255,255,0.06)', duration: 0.1 })
  }
  const handlePointerUpGhost = (e: React.PointerEvent<HTMLButtonElement>) => {
    gsap.to(e.currentTarget, { scale: 1, backgroundColor: 'transparent', duration: 0.2 })
  }

  const handlePointerDownEnd = (e: React.PointerEvent<HTMLButtonElement>) => {
    gsap.to(e.currentTarget, { scale: 0.96, backgroundColor: 'rgba(255,255,255,0.08)', duration: 0.1 })
  }
  const handlePointerUpEnd = (e: React.PointerEvent<HTMLButtonElement>) => {
    gsap.to(e.currentTarget, { scale: 1, backgroundColor: 'rgba(255, 255, 255, 0.04)', duration: 0.2 })
  }

  const handleBackClick = async () => {
    if (pageState === 'connected' || pageState === 'connecting') {
      setShowConfirmModal(true)
    } else {
      await playTransition('voice-to-menu')
      router.push('/kiosk/menu')
    }
  }

  const handleEndSessionClick = async () => {
    clear()
    await playTransition('any-to-pin')
    router.replace('/kiosk')
  }

  // Robust modal pattern
  useEffect(() => {
    if (!showConfirmModal || !modalRef.current || !modalBackdropRef.current || !modalCardRef.current) return

    gsap.killTweensOf([modalBackdropRef.current, modalCardRef.current])

    const isReduced = prefersReducedMotion()

    if (modalTimeline.current) {
      modalTimeline.current.kill()
    }

    modalTimeline.current = gsap.timeline()
      .fromTo(modalBackdropRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power2.out' }, 0)
      
    if (!isReduced) {
      modalTimeline.current.fromTo(modalCardRef.current,
        { opacity: 0, scale: 0.95, y: 10 },
        { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: 'back.out(1.2)' },
        0.05
      )
    } else {
      modalTimeline.current.fromTo(modalCardRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0)
    }

    return () => {
      if (modalTimeline.current) modalTimeline.current.kill()
    }
  }, [showConfirmModal])

  const closeConfirmModal = (confirmed: boolean) => {
    if (!modalTimeline.current || !modalBackdropRef.current || !modalCardRef.current) {
      setShowConfirmModal(false)
      if (confirmed) onEndConversation()
      return
    }

    gsap.killTweensOf([modalBackdropRef.current, modalCardRef.current])
    
    gsap.timeline({
      onComplete: () => {
        setShowConfirmModal(false)
        if (confirmed) onEndConversation()
      }
    })
    .to(modalCardRef.current, { opacity: 0, scale: 0.98, y: -5, duration: 0.2, ease: 'power2.in' }, 0)
    .to(modalBackdropRef.current, { opacity: 0, duration: 0.3, ease: 'power2.inOut' }, 0.05)
  }

  const showStatusPill = ['connecting', 'connected', 'error', 'ended'].includes(pageState)
  
  let statusText = 'Unknown'
  if (pageState === 'connecting') statusText = 'Connecting'
  if (pageState === 'connected') statusText = 'Live'
  if (pageState === 'error') statusText = 'Error'
  if (pageState === 'ended') statusText = 'Ended'

  const showRightControls = pageState !== 'intro'

  return (
    <>
      <header
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '120px',
          padding: '0 40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(28px) saturate(160%)',
          WebkitBackdropFilter: 'blur(28px) saturate(160%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          zIndex: 10,
        }}
      >
        {/* Left */}
        <div style={{ flex: 1, display: 'flex' }}>
          <button
            onClick={handleBackClick}
            onPointerDown={handlePointerDownGhost}
            onPointerUp={handlePointerUpGhost}
            onPointerLeave={handlePointerUpGhost}
            onPointerCancel={handlePointerUpGhost}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              height: '72px',
              padding: '12px 24px',
              borderRadius: '16px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
            }}
          >
            <ArrowLeft size={28} />
            <span className="font-display" style={{ fontSize: 28, fontWeight: 500 }}>
              Back to menu
            </span>
          </button>
        </div>

        {/* Center */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px' }}>
          <Mic size={24} color="var(--accent-voice)" />
          <span className="font-display" style={{ fontSize: 28, fontWeight: 500, color: 'var(--text-secondary)' }}>
            AI Voice Tutor
          </span>
        </div>

        {/* Right */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px' }}>
          {showRightControls && (
            <>
              {/* Level Badge */}
              <div 
                className="font-mono"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: 'var(--text-primary)',
                  padding: '12px 24px',
                  borderRadius: '999px',
                  fontSize: 20,
                  fontWeight: 500,
                }}
              >
                {levelLabel}
              </div>

              {/* Status Pill */}
              {showStatusPill && (
                <div 
                  className="font-mono"
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: 'var(--text-primary)',
                    padding: '12px 24px',
                    borderRadius: '999px',
                    fontSize: 20,
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <div 
                    style={{ 
                      width: '6px', 
                      height: '6px', 
                      borderRadius: '50%', 
                      backgroundColor: orbStateColor,
                      boxShadow: `0 0 6px ${orbStateColor}`,
                      animation: pageState === 'connecting' ? 'pulse 1s infinite alternate' : 'none'
                    }} 
                  />
                  {statusText}
                </div>
              )}

              {/* End Button */}
              {pageState !== 'ended' && (
                <button
                  onClick={handleEndSessionClick}
                  onPointerDown={handlePointerDownEnd}
                  onPointerUp={handlePointerUpEnd}
                  onPointerLeave={handlePointerUpEnd}
                  onPointerCancel={handlePointerUpEnd}
                  className="font-display"
                  style={{
                    height: '72px',
                    padding: '0 28px',
                    borderRadius: '16px',
                    border: '1px solid color-mix(in srgb, var(--accent-danger) 35%, transparent)',
                    color: 'var(--accent-danger)',
                    background: 'rgba(255, 255, 255, 0.04)',
                    fontSize: 28,
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                  }}
                >
                  End <LogOut size={28} />
                </button>
              )}
            </>
          )}
        </div>
      </header>

      {/* Confirm Modal */}
      {showConfirmModal && (
        <div 
          ref={modalRef}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Backdrop */}
          <div 
            ref={modalBackdropRef}
            onClick={() => closeConfirmModal(false)}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          />

          {/* Modal Card */}
          <div 
            ref={modalCardRef}
            style={{
              position: 'relative',
              width: '560px',
              padding: '56px',
              background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)',
              backdropFilter: 'blur(32px) saturate(160%)',
              WebkitBackdropFilter: 'blur(32px) saturate(160%)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '32px',
              boxShadow: '0 24px 64px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
            }}
          >
            <h2 className="font-display" style={{ fontSize: 44, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              End conversation?
            </h2>
            <p className="font-body" style={{ fontSize: 26, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              Your conversation will be ended and you'll return to the menu.
            </p>
            
            <div style={{ display: 'flex', gap: '20px', marginTop: '24px' }}>
              <button
                onClick={() => closeConfirmModal(false)}
                className="font-display"
                style={{
                  flex: 1,
                  height: '88px',
                  borderRadius: '24px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'var(--text-primary)',
                  fontSize: 28,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => closeConfirmModal(true)}
                className="font-display"
                style={{
                  flex: 1,
                  height: '88px',
                  borderRadius: '24px',
                  background: 'var(--accent-danger)',
                  border: 'none',
                  color: '#fff',
                  fontSize: 28,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                End
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
