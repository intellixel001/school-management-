'use client'

import { useRef } from 'react'
import { gsap, useGSAP, prefersReducedMotion } from '@/lib/gsap'

interface SuccessBurstProps {
  origin: { x: number; y: number }
  onComplete: () => void
  accent?: 'cyan'
}

export default function SuccessBurst({
  origin,
  onComplete,
  accent = 'cyan'
}: SuccessBurstProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (!containerRef.current) return

    const tl = gsap.timeline({
      onComplete
    })

    if (prefersReducedMotion()) {
      // Single fade flash
      tl.to('.burst-flash', {
        opacity: 1,
        duration: 0.1,
        ease: 'power2.out'
      }).to('.burst-flash', {
        opacity: 0,
        duration: 0.1,
        ease: 'power2.in'
      })
      return
    }

    // Flash at origin
    tl.to('.burst-flash', {
      opacity: 1,
      duration: 0.05,
      scale: 2,
      ease: 'power2.out'
    }).to('.burst-flash', {
      opacity: 0,
      duration: 0.1,
      ease: 'power2.in'
    }, '+=0')

    // Particles
    const particles = gsap.utils.toArray('.burst-particle')
    tl.fromTo(particles, {
      x: origin.x,
      y: origin.y,
      scale: 0,
      opacity: 0
    }, {
      x: () => origin.x + Math.cos(Math.random() * Math.PI * 2) * (200 + Math.random() * 400),
      y: () => origin.y + Math.sin(Math.random() * Math.PI * 2) * (200 + Math.random() * 400),
      scale: () => 0.5 + Math.random() * 1.5,
      opacity: () => 0.6 + Math.random() * 0.4,
      duration: 0.4,
      ease: 'power3.out',
      stagger: {
        each: 0.002,
        from: 'random'
      }
    }, 0)

    // Dissipate particles
    tl.to(particles, {
      scale: 0,
      opacity: 0,
      duration: 0.2,
      ease: 'power2.in'
    }, '-=0.2')

  }, { scope: containerRef, dependencies: [origin] })

  // Pre-generate particles
  const particleCount = 50
  const particles = Array.from({ length: particleCount }).map((_, i) => {
    // some particles at var(--accent-secondary) for variety
    const isSecondary = Math.random() > 0.7
    const color = isSecondary ? 'var(--accent-secondary)' : 'var(--accent-primary)'
    return (
      <div
        key={i}
        className="burst-particle absolute rounded-full"
        style={{
          width: '6px',
          height: '6px',
          background: color,
          boxShadow: `0 0 12px ${color}`,
          left: 0,
          top: 0,
          opacity: 0,
          transform: `translate(${origin.x}px, ${origin.y}px)`
        }}
      />
    )
  })

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-[100] overflow-hidden"
    >
      <div
        className="burst-flash absolute rounded-full"
        style={{
          width: '100px',
          height: '100px',
          left: origin.x - 50,
          top: origin.y - 50,
          background: 'radial-gradient(circle, #fff 0%, transparent 70%)',
          opacity: 0,
        }}
      />
      {particles}
    </div>
  )
}
