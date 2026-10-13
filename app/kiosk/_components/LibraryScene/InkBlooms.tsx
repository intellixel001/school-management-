'use client'

import { useRef } from 'react'
import { gsap, useGSAP, prefersReducedMotion } from '@/lib/gsap'

export function InkBlooms() {
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (prefersReducedMotion() || !containerRef.current) return

    const blobs = gsap.utils.toArray<HTMLElement>('.ink-bloom')
    blobs.forEach((blob, i) => {
      // 18s cycle, scale 1.0 <-> 1.15, out of phase with each other
      gsap.to(blob, {
        scale: 1.15,
        duration: 9, // half of 18s
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        delay: i * -4.5 // out of phase
      })
    })
  }, { scope: containerRef })

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none" style={{ zIndex: 6, opacity: 0 }} id="ink-blooms-container">
      {/* Top Left */}
      <svg className="absolute top-0 left-0 ink-bloom origin-top-left" style={{ width: '30vw', height: '30vh', transform: 'translate(-30%, -30%)' }}>
        <defs>
          <radialGradient id="ink-grad-tl">
            <stop offset="0%" stopColor="rgba(180, 120, 60, 0.18)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
        <circle cx="50%" cy="50%" r="50%" fill="url(#ink-grad-tl)" filter="blur(30px)" />
      </svg>

      {/* Top Right */}
      <svg className="absolute top-0 right-0 ink-bloom origin-top-right" style={{ width: '30vw', height: '30vh', transform: 'translate(30%, -30%)' }}>
        <defs>
          <radialGradient id="ink-grad-tr">
            <stop offset="0%" stopColor="rgba(180, 120, 60, 0.18)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
        <circle cx="50%" cy="50%" r="50%" fill="url(#ink-grad-tr)" filter="blur(30px)" />
      </svg>

      {/* Bottom Left */}
      <svg className="absolute bottom-0 left-0 ink-bloom origin-bottom-left" style={{ width: '30vw', height: '30vh', transform: 'translate(-30%, 30%)' }}>
        <defs>
          <radialGradient id="ink-grad-bl">
            <stop offset="0%" stopColor="rgba(180, 120, 60, 0.18)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
        <circle cx="50%" cy="50%" r="50%" fill="url(#ink-grad-bl)" filter="blur(30px)" />
      </svg>

      {/* Bottom Right */}
      <svg className="absolute bottom-0 right-0 ink-bloom origin-bottom-right" style={{ width: '30vw', height: '30vh', transform: 'translate(30%, 30%)' }}>
        <defs>
          <radialGradient id="ink-grad-br">
            <stop offset="0%" stopColor="rgba(180, 120, 60, 0.18)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
        <circle cx="50%" cy="50%" r="50%" fill="url(#ink-grad-br)" filter="blur(30px)" />
      </svg>
    </div>
  )
}
