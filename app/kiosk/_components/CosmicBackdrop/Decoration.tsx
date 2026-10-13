'use client'

import { useRef, useMemo, useState } from 'react'
import Image from 'next/image'
import { gsap, useGSAP, prefersReducedMotion } from '@/lib/gsap'
import type { CosmicAsset } from '@/lib/cosmicAssets'

interface DecorationProps {
  asset: CosmicAsset
  position: { x: string; y: string }
  scale: number
  depth: 'far' | 'mid' | 'near'
  seedOffset: number
  priority?: boolean
}

export default function Decoration({
  asset,
  position,
  scale,
  depth,
  seedOffset,
  priority = false
}: DecorationProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  const { opacity, blur, floatAmount, zIndex } = useMemo(() => {
    switch (depth) {
      case 'far': return { opacity: 0.85, blur: 0, floatAmount: 8, zIndex: 1 }
      case 'mid': return { opacity: 0.95, blur: 0, floatAmount: 15, zIndex: 2 }
      case 'near': return { opacity: 1, blur: 0, floatAmount: 20, zIndex: 3 }
    }
  }, [depth])

  useGSAP(() => {
    if (prefersReducedMotion() || !containerRef.current) return

    const el = containerRef.current
    
    // Pseudo-random based on seedOffset so it's consistent but varied
    const rng = (min: number, max: number, offset: number) => {
      const v = Math.abs(Math.sin(seedOffset * 100 + offset))
      return min + v * (max - min)
    }

    if (asset.type === 'mascot') {
      // Mascot: moderate drift and tumbling
      const glideX = rng(30, 70, 1) * (rng(0, 1, 2) > 0.5 ? 1 : -1)
      const glideY = rng(20, 50, 3) * (rng(0, 1, 4) > 0.5 ? 1 : -1)

      gsap.to(el, {
        x: `+=${glideX}`,
        y: `+=${glideY}`,
        duration: rng(20, 35, 5),
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: -rng(0, 10, 6),
      })

      // Continuous tumbling for the AI mascot in space
      gsap.to(el, {
        rotation: (rng(0, 1, 8) > 0.5 ? 1 : -1) * 360,
        duration: rng(60, 120, 9), // Slow tumble
        repeat: -1,
        ease: 'none',
        transformOrigin: 'center center'
      })
    } else {
      // Literature items (book, writing-tool, decor): 
      // Subtle, slow hovering and gliding. NO full rotation.
      gsap.to(el, {
        y: `+=${rng(15, 30, 1) * (rng(0, 1, 2) > 0.5 ? 1 : -1)}`,
        x: `+=${rng(10, 20, 3) * (rng(0, 1, 4) > 0.5 ? 1 : -1)}`,
        duration: rng(30, 50, 3), // very slow
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: -rng(0, 10, 4),
      })
      
      // A very tiny gentle rocking rotation to make it feel alive, NOT a full spin
      gsap.to(el, {
        rotation: (rng(0, 1, 8) > 0.5 ? 1 : -1) * rng(2, 6, 7), // Just 2 to 6 degrees of tilt
        duration: rng(40, 60, 9),
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        transformOrigin: 'center center'
      })
    }

    // Scale breath (subtle pulse for all items)
    if (rng(0, 1, 7) > 0.5) {
      gsap.to(el, {
        scale: 1.02,
        duration: rng(8, 14, 8),
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: -rng(0, 10, 9)
      })
    }
  }, { scope: containerRef, dependencies: [floatAmount, seedOffset] })

  // Dimensions based on natural aspect
  const width = scale
  const height = scale / asset.naturalAspect

  return (
    <div
      className="absolute pointer-events-none transition-opacity duration-1000 ease-in-out"
      style={{
        left: position.x,
        top: position.y,
        zIndex,
        opacity: isLoaded ? 1 : 0,
        // Center the element around the given position
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          width,
          height,
          opacity,
          filter: blur > 0 ? `blur(${blur}px)` : 'none',
        }}
      >
        <Image
          src={asset.url}
          alt=""
          fill
          sizes={`${Math.ceil(scale)}px`}
          priority={priority}
          className="object-contain"
          draggable={false}
          onLoad={() => setIsLoaded(true)}
        />
      </div>
    </div>
  )
}
