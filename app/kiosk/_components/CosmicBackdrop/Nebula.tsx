'use client'

import { useRef } from 'react'
import { gsap, useGSAP, prefersReducedMotion } from '@/lib/gsap'

interface NebulaProps {
  accent?: 'cyan' | 'indigo' | 'amber' | 'emerald'
}

const ACCENT_GLOW_MAP = {
  cyan: 'var(--accent-glow)',
  indigo: 'var(--accent-practice-glow)',
  amber: 'var(--accent-mock-glow)',
  emerald: 'var(--accent-voice-glow)',
}

export default function Nebula({ accent = 'cyan' }: NebulaProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const glowColor = ACCENT_GLOW_MAP[accent]

  useGSAP(() => {
    if (prefersReducedMotion()) return

    const blobs = gsap.utils.toArray<HTMLElement>('.nebula-blob')
    
    blobs.forEach((blob, i) => {
      // Drifting position
      gsap.to(blob, {
        x: 'random(-5vw, 5vw)',
        y: 'random(-5vh, 5vh)',
        duration: 'random(20, 40)',
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: -Math.random() * 20
      })

      // Opacity oscillation
      gsap.to(blob, {
        opacity: 'random(0.4, 0.7)',
        duration: 'random(10, 20)',
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: -Math.random() * 10
      })
    })
  }, { scope: containerRef, dependencies: [] })

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={{ mixBlendMode: 'screen' }}
    >
      <div
        className="nebula-blob absolute rounded-full"
        style={{
          width: '70vw',
          height: '70vh',
          top: '-10%',
          right: '-10%',
          background: `radial-gradient(ellipse at center, ${glowColor} 0%, transparent 70%)`,
          filter: 'blur(80px)',
          opacity: 0.6,
        }}
      />
      <div
        className="nebula-blob absolute rounded-full"
        style={{
          width: '80vw',
          height: '80vh',
          bottom: '-20%',
          left: '-10%',
          background: `radial-gradient(ellipse at center, ${glowColor} 0%, transparent 60%)`,
          filter: 'blur(80px)',
          opacity: 0.5,
        }}
      />
      <div
        className="nebula-blob absolute rounded-full"
        style={{
          width: '60vw',
          height: '60vh',
          top: '30%',
          left: '20%',
          background: `radial-gradient(ellipse at center, ${glowColor} 0%, transparent 65%)`,
          filter: 'blur(60px)',
          opacity: 0.4,
        }}
      />
    </div>
  )
}
