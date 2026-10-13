'use client'

import { useRef, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { gsap, prefersReducedMotion } from '@/lib/gsap'
import { useTransition } from '../../_components/TransitionProvider'
import { kioskAudio } from '@/lib/kiosk/audio'

interface PracticeCardProps {
  skill: 'reading' | 'writing' | 'listening' | 'speaking'
  accent: string
  title: string
  subtitle: string
  assetSrc: string
  assetIntrinsicWidth: number
  assetIntrinsicHeight: number
  href: string
  index: 0 | 1 | 2 | 3
}

export default function PracticeCard({
  skill,
  accent,
  title,
  subtitle,
  assetSrc,
  assetIntrinsicWidth,
  assetIntrinsicHeight,
  href,
  index
}: PracticeCardProps) {
  const router = useRouter()
  const { playTransition } = useTransition()
  
  const cardRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)
  const robotRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (prefersReducedMotion()) return

    const robot = robotRef.current
    if (!robot) return

    const tween = gsap.to(robot, {
      y: '-=8',
      duration: 3.5 + index * 0.5,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut',
    })

    return () => {
      tween.kill()
    }
  }, [index])

  const handlePointerDown = () => {
    if (!cardRef.current || !glowRef.current || !robotRef.current) return
    kioskAudio.playTap()
    gsap.to(cardRef.current, { scale: 0.97, duration: 0.12, ease: 'power2.out' })
    gsap.to(glowRef.current, { opacity: 0.7, duration: 0.15, ease: 'power2.out' })
    gsap.to(robotRef.current, { scale: 1.04, duration: 0.12, ease: 'power2.out' })
  }

  const handlePointerUp = () => {
    if (!cardRef.current || !glowRef.current || !robotRef.current) return
    gsap.to(cardRef.current, { scale: 1, duration: 0.2, ease: 'power2.out' })
    gsap.to(glowRef.current, { opacity: 0.4, duration: 0.2, ease: 'power2.out' })
    gsap.to(robotRef.current, { scale: 1, duration: 0.2, ease: 'power2.out' })
  }

  const handleTap = async () => {
    if (!cardRef.current) {
      router.push(href)
      return
    }
    const sourceRect = cardRef.current.getBoundingClientRect()
    await playTransition('menu-to-practice', { sourceRect, accentColor: accent }, cardRef.current)
    router.push(href)
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
      className="practice-card-wrapper w-full"
      style={{ textDecoration: 'none', display: 'block', outline: 'none' }}
    >
      <div
        ref={cardRef}
        className="practice-card"
        data-card-skill={skill}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{
          position: 'relative',
          width: '100%',
          height: 300,
          display: 'flex',
          flexDirection: index % 2 === 0 ? 'row' : 'row-reverse',
          borderRadius: 14,
          background: 'linear-gradient(180deg, rgba(30, 18, 13, 0.88) 0%, rgba(22, 13, 10, 0.78) 100%)',
          backdropFilter: 'blur(14px) saturate(120%)',
          WebkitBackdropFilter: 'blur(14px) saturate(120%)',
          border: '1px solid rgba(198, 158, 92, 0.28)',
          boxShadow: '0 14px 40px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 230, 180, 0.12)',
          overflow: 'hidden',
          cursor: 'default',
          opacity: 0,
        }}
      >
        <div
          ref={glowRef}
          className="accent-glow"
          style={{
            position: 'absolute',
            top: '-20%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '100%',
            height: '140%',
            background: 'radial-gradient(ellipse at 30% 50%, rgba(232, 185, 108, 0.55) 0%, transparent 65%)',
            filter: 'blur(70px)',
            opacity: 0,
            pointerEvents: 'none',
          }}
        />

        {/* Robot Stage — flex-start + paddingTop pushes the bot DOWN so the
            antenna has breathing room at the top of the card, and the wheels/
            legs drop off the bottom. The wrapper stays tall so the bot itself
            keeps its size. */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            width: '50%',
            height: '100%',
            position: 'relative',
            paddingLeft: 24,
            paddingRight: 24,
            paddingTop: 24,
          }}
        >
          <div ref={robotRef} className="card-robot" style={{ height: '125%', display: 'flex', alignItems: 'center', opacity: 0 }}>
            <Image
              src={assetSrc}
              width={assetIntrinsicWidth}
              height={assetIntrinsicHeight}
              alt={`AI tutor ${skill}`}
              priority
              style={{
                height: '100%',
                width: 'auto',
                objectFit: 'contain',
                filter: 'hue-rotate(-140deg) saturate(0.85) brightness(1.05)',
              }}
            />
          </div>
        </div>

        {/* Text Block */}
        <div
          style={{
            width: '50%',
            height: '100%',
            padding: '0 40px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            position: 'relative',
            zIndex: 2,
          }}
        >
          <div
            className="card-title"
            style={{
              display: 'inline-block',
              padding: '12px 28px',
              borderRadius: 6,
              background: 'linear-gradient(180deg, #C9A557 0%, #8A6D34 100%)',
              border: '1px solid rgba(255, 233, 180, 0.28)',
              boxShadow: 'inset 0 1px 0 rgba(255,245,214,0.35), 0 3px 10px rgba(0,0,0,0.4)',
              alignSelf: 'flex-start',
              opacity: 0,
            }}
          >
            <h2 
              className="font-display" 
              style={{ 
                fontSize: 34, 
                fontWeight: 700, 
                color: '#2E2310',
                textShadow: '0 1px 0 rgba(255,240,200,0.35)',
                letterSpacing: '0.02em',
                margin: 0,
              }}
            >
              {title}
            </h2>
          </div>
          <p 
            className="font-body card-subtitle" 
            style={{ 
              fontSize: 22, 
              color: 'rgba(245, 237, 216, 0.72)', 
              lineHeight: 1.5, 
              margin: 0,
              marginTop: 20,
              maxWidth: '44ch',
              opacity: 0,
            }}
          >
            {subtitle}
          </p>
          <div 
            className="font-mono card-caption"
            style={{ 
              fontSize: 18,
              fontWeight: 600,
              color: '#E8B96C',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              opacity: 0,
              margin: 0,
              marginTop: 20
            }}
          >
            TAP TO START
          </div>
        </div>
      </div>
    </div>
  )
}
