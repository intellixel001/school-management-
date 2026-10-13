'use client'

import { useRef, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import gsap from 'gsap'
import { prefersReducedMotion } from '@/lib/gsap'
import { useTransition } from '../../_components/TransitionProvider'
import type { TransitionKind } from '@/lib/transitions/types'

type Variant = 'practice' | 'mock' | 'voice'

interface MenuCardProps {
  variant: Variant
  title: string
  subtitle: string
  assetSrc: string
  assetIntrinsicWidth: number
  assetIntrinsicHeight: number
  href: string
  index: 0 | 1 | 2
}

export default function MenuCard({
  variant,
  title,
  subtitle,
  assetSrc,
  assetIntrinsicWidth,
  assetIntrinsicHeight,
  href,
  index
}: MenuCardProps) {
  const router = useRouter()
  const { playTransition } = useTransition()
  
  const cardRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)
  const assetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (prefersReducedMotion()) return

    const asset = assetRef.current
    if (!asset) return

    let tween: gsap.core.Tween | undefined

    if (variant === 'practice') {
      tween = gsap.to(asset, {
        y: 8,
        yoyo: true,
        repeat: -1,
        duration: 2,
        ease: 'sine.inOut',
      })
    } else if (variant === 'mock') {
      tween = gsap.to(asset, {
        rotation: 2,
        yoyo: true,
        repeat: -1,
        duration: 2.5,
        ease: 'sine.inOut',
      })
    } else if (variant === 'voice') {
      tween = gsap.to(asset, {
        y: 6,
        rotation: -9,
        yoyo: true,
        repeat: -1,
        duration: 2,
        ease: 'sine.inOut',
      })
    }

    return () => {
      if (tween) tween.kill()
    }
  }, [variant])

  const handlePointerDown = () => {
    if (!cardRef.current || !glowRef.current) return
    gsap.to(cardRef.current, { scale: 0.97, duration: 0.12, ease: 'power2.out' })
    gsap.to(glowRef.current, { opacity: 0.7, duration: 0.12, ease: 'power2.out' })
  }

  const handlePointerUp = () => {
    if (!cardRef.current || !glowRef.current) return
    gsap.to(cardRef.current, { scale: 1, duration: 0.2, ease: 'power2.out' })
    gsap.to(glowRef.current, { opacity: 0.4, duration: 0.2, ease: 'power2.out' })
  }

  const handleTap = async () => {
    if (!cardRef.current) {
      router.push(href)
      return
    }
    const sourceRect = cardRef.current.getBoundingClientRect()
    const accentColor = variant === 'practice' ? '#818CF8' : variant === 'mock' ? '#FBBF24' : '#34D399'
    const transitionKind = (
      variant === 'voice' ? 'menu-to-voice' :
      variant === 'practice' ? 'menu-to-practice' :
      'menu-to-mock'
    ) as TransitionKind
    await playTransition(transitionKind, { sourceRect, accentColor }, cardRef.current)
    router.push(href)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleTap()
    }
  }

  // Accessibility Note: Replacing <Link> with <div role="button"> disables 
  // Next.js automatic route prefetching. For a kiosk app, this is acceptable.
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleTap}
      onKeyDown={handleKeyDown}
      className="flex-1"
      // Wider footprint for the 40.7" portrait kiosk. Aspect ratio on the
      // inner .menu-card stays the same, so the internal image sizes are
      // untouched — they scale relative to the card.
      style={{ textDecoration: 'none', display: 'block', outline: 'none', minWidth: 380, maxWidth: 560 }}
    >
      <div
        ref={cardRef}
        className="menu-card"
        data-card-variant={variant}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '380 / 580',
          borderRadius: 24,
          background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.02) 100%)',
          backdropFilter: 'blur(20px) saturate(140%)',
          WebkitBackdropFilter: 'blur(20px) saturate(140%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
          overflow: 'hidden',
          cursor: 'pointer',
        }}
      >
        <div
          ref={glowRef}
          className="accent-glow"
          style={{
            position: 'absolute',
            top: '-40%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '120%',
            height: '80%',
            background: 'radial-gradient(ellipse at center, var(--accent-current) 0%, transparent 60%)',
            filter: 'blur(60px)',
            opacity: 0.4,
            pointerEvents: 'none',
          }}
        />

        {variant === 'practice' && (
          <>
            <div
              className="card-asset"
              ref={assetRef}
              style={{
                height: '60%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Image
                src={assetSrc}
                width={assetIntrinsicWidth}
                height={assetIntrinsicHeight}
                alt="Practice"
                style={{ width: '75%', height: 'auto', marginTop: '12%' }}
                priority
              />
            </div>
            <div
              style={{
                position: 'absolute',
                bottom: 36,
                left: 32,
                right: 32,
                zIndex: 2,
              }}
            >
              <h2 className="card-title font-display" style={{
                fontSize: 60,
                fontWeight: 700,
                background: 'linear-gradient(180deg, #FFFFFF 0%, rgba(255,255,255,0.6) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.02em',
                margin: 0,
                textAlign: 'center',
              }}>
                {title}
              </h2>
            </div>
          </>
        )}

        {variant === 'mock' && (
          <>
            <div
              style={{
                height: '60%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div ref={assetRef} className="card-asset" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                <Image
                  src={assetSrc}
                  width={assetIntrinsicWidth}
                  height={assetIntrinsicHeight}
                  alt="Mock test"
                  style={{ width: '70%', maxWidth: 280, height: 'auto' }}
                  priority
                />
              </div>
            </div>
            <div
              style={{
                position: 'absolute',
                bottom: 36,
                left: 32,
                right: 32,
                zIndex: 2,
              }}
            >
              <h2 className="card-title font-display" style={{
                fontSize: 60,
                fontWeight: 700,
                background: 'linear-gradient(180deg, #FFFFFF 0%, rgba(255,255,255,0.6) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.02em',
                margin: 0,
                textAlign: 'center',
              }}>
                {title}
              </h2>
            </div>
          </>
        )}

        {variant === 'voice' && (
          <>
            <div
              style={{ position: 'absolute', top: 32, left: 32, right: 32, zIndex: 2 }}
            >
              <h2 className="card-title font-display" style={{
                fontSize: 60,
                fontWeight: 700,
                background: 'linear-gradient(180deg, #FFFFFF 0%, rgba(255,255,255,0.6) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.02em',
                margin: 0,
                textAlign: 'center',
              }}>
                {title}
              </h2>
            </div>
            <div
              ref={assetRef}
              className="card-asset"
              style={{
                position: 'absolute',
                bottom: -180,
                right: -30,
                transform: 'rotate(-8deg)',
                transformOrigin: 'center center',
              }}
            >
              <Image
                src={assetSrc}
                width={assetIntrinsicWidth}
                height={assetIntrinsicHeight}
                alt="AI tutor"
                style={{ width: 300, height: 'auto' }}
                priority
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
