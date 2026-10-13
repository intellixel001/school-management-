'use client'

import { useRef, useEffect } from 'react'
import Image from 'next/image'
import { gsap, prefersReducedMotion } from '@/lib/gsap'
import { LibraryPropConfig } from './props.config'
import styles from './LibraryScene.module.css'

interface LibraryPropProps {
  config: LibraryPropConfig
}

export function LibraryProp({ config }: LibraryPropProps) {
  const propRef = useRef<HTMLDivElement>(null)

  // Mapping depth strings to CSS classes
  const depthClass = {
    near: styles.depthNear,
    mid: styles.depthMid,
    far: styles.depthFar,
  }[config.depth]

  useEffect(() => {
    if (prefersReducedMotion() || !propRef.current) return

    const el = propRef.current
    let tween: gsap.core.Tween | null = null

    // Idle loops (all infinite, sine.inOut, random start seed via delay or random initial state if needed)
    // Randomize initial progress so they don't all move in sync
    const startProgress = Math.random()

    switch (config.motion) {
      case 'gentle-sway':
        tween = gsap.to(el, {
          rotation: `+=${6}`, // ±3° -> total range 6, but we'll use yoyo
          x: `+=${16}`,      // ±8px
          duration: 16,      // 32s cycle (16s one way, yoyo back)
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        })
        gsap.set(el, { rotation: config.rotate - 3, x: -8 })
        break

      case 'bob-tilt':
        tween = gsap.to(el, {
          y: `+=${30}`,
          rotation: `+=${8}`,
          duration: 8,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        })
        gsap.set(el, { rotation: config.rotate - 4, y: -15 })
        break

      case 'page-turn':
        tween = gsap.to(el, {
          y: `+=${28}`,
          rotation: `+=${12}`,
          duration: 11,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        })
        gsap.set(el, { rotation: config.rotate - 6, y: -14 })
        break

      case 'writing-rock':
        // Origin bottom
        gsap.set(el, { transformOrigin: 'bottom center', rotation: config.rotate - 5 })
        tween = gsap.to(el, {
          rotation: `+=${10}`,
          duration: 2.5,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        })
        break

      case 'slow-drift':
        tween = gsap.to(el, {
          x: `+=${120}`,
          rotation: `+=${4}`,
          duration: 19,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        })
        gsap.set(el, { rotation: config.rotate - 2, x: -60 })
        break

      case 'subtle-breath':
        tween = gsap.to(el, {
          y: `+=${12}`,
          duration: 10,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        })
        gsap.set(el, { y: -6 })
        break

      case 'flame-flicker':
        // Not a transform, but a filter drop-shadow oscillation
        // Base is set via inline style for reduced motion. 
        // We start from min and tween to max to oscillate ±25%
        tween = gsap.to(el, {
          filter: 'drop-shadow(0 -10px 30px rgba(255, 200, 120, 1.0)) drop-shadow(0 -25px 75px rgba(232, 185, 108, 0.68))',
          duration: 0.9,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        })
        gsap.set(el, { filter: 'drop-shadow(0 -6px 18px rgba(255, 200, 120, 0.71)) drop-shadow(0 -15px 45px rgba(232, 185, 108, 0.41))' })
        break

      case 'hang-swing':
        gsap.set(el, { transformOrigin: 'top center', rotation: config.rotate - 8 })
        tween = gsap.to(el, {
          rotation: `+=${16}`,
          duration: 3.5,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        })
        break
    }

    if (tween) {
      tween.progress(startProgress)
    }

    return () => {
      if (tween) tween.kill()
    }
  }, [config])

  return (
    <div
      className={`absolute library-prop library-prop-${config.id} ${depthClass}`}
      style={{
        left: `${config.x}%`,
        top: `${config.y}%`,
        width: config.size,
        height: config.size,
        // Centering on the coordinates
        transform: `translate(-50%, -50%) rotate(${config.rotate}deg)`,
        opacity: 0, // Managed by entrance timeline
      }}
    >
      <div 
        ref={propRef} 
        className="w-full h-full relative" 
        style={{ 
          transformOrigin: 'center center',
          filter: config.id === 'brass-candle' ? 'drop-shadow(0 -8px 24px rgba(255, 200, 120, 0.95)) drop-shadow(0 -20px 60px rgba(232, 185, 108, 0.55))' : undefined
        }}
      >
        <Image
          src={config.url}
          alt={config.id}
          fill
          className="object-contain pointer-events-none"
          sizes={`${config.size}px`}
          priority
        />
        {config.id === 'brass-candle' && (
          <div 
            className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[40px] h-[60px] rounded-full pointer-events-none" 
            style={{ 
              background: 'radial-gradient(circle, rgba(255, 200, 120, 0.8) 0%, transparent 60%)', 
              filter: 'blur(10px)' 
            }} 
          />
        )}
      </div>
    </div>
  )
}
