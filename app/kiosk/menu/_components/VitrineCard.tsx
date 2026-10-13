'use client'

import { useRef, useEffect, useState } from 'react'
import Image from 'next/image'
import gsap from 'gsap'
import { prefersReducedMotion } from '@/lib/gsap'
import { kioskAudio } from '@/lib/kiosk/audio'
import type { ModeConfig } from './modes.config'

interface VitrineCardProps {
  config: ModeConfig
  isActive: boolean
  onPointerDown: () => void
  onPointerUp: () => void
  /**
   * `el` is the element the transition clones as its flying ghost. It must be
   * this card — never a page-level container.
   */
  onTap: (rect: DOMRect, el: HTMLElement | null) => void
}

export default function VitrineCard({
  config,
  isActive,
  onPointerDown,
  onPointerUp,
  onTap
}: VitrineCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const spotlightRef = useRef<HTMLDivElement>(null)
  const objectRef = useRef<HTMLDivElement>(null)
  const sheenRef = useRef<HTMLDivElement>(null)
  const plaqueRef = useRef<HTMLDivElement>(null)
  
  const [isPressed, setIsPressed] = useState(false)

  // Idle animations
  useEffect(() => {
    if (prefersReducedMotion()) return

    const tlObject = gsap.to(objectRef.current, {
      y: 7,
      rotation: config.id === 'voice' ? 2 : 0,
      yoyo: true,
      repeat: -1,
      duration: 3.5, // 7s cycle
      ease: 'sine.inOut',
    })

    const tlSpotlight = gsap.to(spotlightRef.current, {
      opacity: 0.58,
      yoyo: true,
      repeat: -1,
      duration: 4.5, // 9s cycle
      ease: 'sine.inOut',
    })

    const tlSheen = gsap.to(sheenRef.current, {
      x: 10,
      yoyo: true,
      repeat: -1,
      duration: 7, // 14s cycle
      ease: 'sine.inOut',
    })

    return () => {
      tlObject.kill()
      tlSpotlight.kill()
      tlSheen.kill()
    }
  }, [config.id])

  // Reactive state changes (press + external highlight)
  useEffect(() => {
    const isReduced = prefersReducedMotion()
    const targetScale = isPressed ? 0.97 : 1
    const targetPlaqueBright = isPressed ? 1.12 : 1
    
    // Spotlight is 0.85 if pressed locally, 0.7 if highlighted remotely, 0.5 if idle
    const targetSpotlightOp = isPressed ? 0.85 : (isActive ? 0.7 : 0.5)

    if (isReduced) {
      gsap.set(cardRef.current, { scale: targetScale })
      gsap.set(spotlightRef.current, { opacity: targetSpotlightOp })
      gsap.set(plaqueRef.current, { filter: `brightness(${targetPlaqueBright})` })
      return
    }

    gsap.to(cardRef.current, { scale: targetScale, duration: isPressed ? 0.12 : 0.2, ease: 'power2.out' })
    gsap.to(spotlightRef.current, { opacity: targetSpotlightOp, duration: isPressed ? 0.12 : 0.2, ease: 'power2.out' })
    gsap.to(plaqueRef.current, { filter: `brightness(${targetPlaqueBright})`, duration: isPressed ? 0.12 : 0.2, ease: 'power2.out' })
  }, [isPressed, isActive])

  const handlePointerDown = () => {
    kioskAudio.playTap()
    setIsPressed(true)
    onPointerDown()
  }

  const handlePointerUp = () => {
    setIsPressed(false)
    onPointerUp()
  }

  const handleTap = async () => {
    const el = cardRef.current
    const rect = el?.getBoundingClientRect() || new DOMRect()
    onTap(rect, el)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleTap()
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleTap}
      onKeyDown={handleKeyDown}
      className="flex-1 vitrine-card"
      style={{
        display: 'block',
        outline: 'none',
        maxWidth: 340, // Reduced from 560 for 1080px kiosk
        minWidth: 0,   // Let it shrink if needed
      }}
    >
      <div
        ref={cardRef}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '380 / 580',
          borderRadius: 14,
          border: '1px solid rgba(198, 158, 92, 0.32)',
          boxShadow: '0 18px 50px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255, 230, 180, 0.14)',
          overflow: 'hidden',
          cursor: 'pointer',
        }}
      >
        {/* Interior back wall */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(28,16,12,0.82) 0%, rgba(12,7,10,0.92) 100%)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        />

        {/* Spotlight cone */}
        <div
          ref={spotlightRef}
          className="menu-spotlight"
          style={{
            position: 'absolute',
            top: 0,
            left: '11%',
            width: '78%',
            height: '62%',
            background: `radial-gradient(ellipse 50% 60% at 50% 0%, color-mix(in srgb, ${config.accent} 42%, #FFE9C4) 0%, transparent 70%)`,
            filter: 'blur(26px)',
            opacity: 0, // start at 0 for GSAP entrance timeline
            pointerEvents: 'none',
          }}
        />

        {/* Plinth */}
        <div
          style={{
            position: 'absolute',
            bottom: '22%',
            left: '27%',
            width: '46%',
            height: 18,
            borderRadius: '50%',
            background: 'linear-gradient(180deg, #6B5842, #3A2E22)',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15)',
          }}
        />

        {/* Contact shadow */}
        <div
          style={{
            position: 'absolute',
            bottom: '23%',
            left: '20%',
            width: '60%',
            height: 24,
            background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.55) 0%, transparent 70%)',
            filter: 'blur(8px)',
          }}
        />

        {/* Hero object */}
        <div
          ref={objectRef}
          style={{
            position: 'absolute',
            top: '8%',
            left: 0,
            right: 0,
            height: '66%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              position: 'relative',
              width: `${70 * (config.objectScale ?? 1)}%`,
              aspectRatio: config.objectAspect,
              transform: config.objectRotate ? `rotate(${config.objectRotate}deg)` : undefined,
            }}
          >
            <Image
              src={config.objectUrl}
              alt={config.title}
              fill
              sizes="(max-width: 1080px) 100vw, 340px"
              style={{ objectFit: 'contain' }}
              priority
            />
          </div>
        </div>

        {/* Glass sheen */}
        <div
          ref={sheenRef}
          style={{
            position: 'absolute',
            inset: -20, // pad to allow x translation
            background: 'linear-gradient(118deg, transparent 32%, rgba(255,255,255,0.07) 44%, rgba(255,255,255,0.02) 52%, transparent 62%)',
            pointerEvents: 'none',
          }}
        />

        {/* Brass plaque */}
        <div
          ref={plaqueRef}
          style={{
            position: 'absolute',
            bottom: 28,
            left: 24,
            right: 24,
            height: 84,
            borderRadius: 5,
            background: 'linear-gradient(180deg, #C9A557 0%, #8A6D34 100%)',
            border: '1px solid rgba(255, 233, 180, 0.28)',
            boxShadow: 'inset 0 1px 0 rgba(255,245,214,0.35), 0 4px 14px rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <span
            className="font-display"
            style={{
              fontWeight: 700,
              fontSize: 32, // Adjusted from 34 to ensure it fits ~315 width
              letterSpacing: '0.04em',
              color: '#2E2310',
              textShadow: '0 1px 0 rgba(255,240,200,0.35)',
            }}
          >
            {config.title}
          </span>
        </div>
      </div>
    </div>
  )
}
