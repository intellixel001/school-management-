'use client'

import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { prefersReducedMotion } from '@/lib/gsap'
import VoiceOrb from './VoiceOrb'

interface VoiceIntroProps {
  studentFirstName?: string
  levelLabel: string
  onStart: () => void
}

export default function VoiceIntro({ studentFirstName, levelLabel, onStart }: VoiceIntroProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const orbRef = useRef<HTMLDivElement>(null)
  const greetingRef = useRef<HTMLHeadingElement>(null)
  const subtitleRef = useRef<HTMLParagraphElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const micCaveatRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!orbRef.current || !greetingRef.current || !subtitleRef.current || !btnRef.current || !micCaveatRef.current) return

    const isReduced = prefersReducedMotion()

    if (isReduced) {
      gsap.set([orbRef.current, greetingRef.current, subtitleRef.current, btnRef.current, micCaveatRef.current], { opacity: 1, scale: 1, y: 0 })
      return
    }

    const tl = gsap.timeline()
    
    // 0.0s Preview orb
    tl.fromTo(orbRef.current, 
      { scale: 0.7, opacity: 0 }, 
      { scale: 1, opacity: 1, duration: 1.0, ease: 'power3.out' },
      0
    )
    
    // 0.6s Greeting
    tl.fromTo(greetingRef.current,
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' },
      0.6
    )

    // 0.8s Subtitle
    tl.fromTo(subtitleRef.current,
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' },
      0.8
    )

    // 1.0s Start button
    tl.fromTo(btnRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' },
      1.0
    )

    // 1.2s Mic caveat
    tl.fromTo(micCaveatRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' },
      1.2
    )

    return () => {
      tl.kill()
    }
  }, [])

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    gsap.to(e.currentTarget, { scale: 0.97, filter: 'brightness(1.08)', duration: 0.1 })
  }
  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    gsap.to(e.currentTarget, { scale: 1, filter: 'brightness(1)', duration: 0.2 })
  }

  return (
    <div 
      ref={containerRef}
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 5,
        paddingTop: '80px' // offset for header
      }}
    >
      <div ref={orbRef} style={{ opacity: 0, marginBottom: '80px' }}>
        <VoiceOrb state="idle" size={320} />
      </div>

      <h1
        ref={greetingRef}
        className="font-display"
        style={{
          fontSize: 80,
          fontWeight: 700,
          color: 'var(--text-primary)',
          opacity: 0,
          margin: '0 0 32px 0',
          textAlign: 'center',
          letterSpacing: '-0.02em',
          lineHeight: 1.05,
        }}
      >
        Hello{studentFirstName ? `, ${studentFirstName}` : ''}.
      </h1>

      <p
        ref={subtitleRef}
        className="font-display"
        style={{
          fontSize: 32,
          fontWeight: 400,
          color: 'var(--text-secondary)',
          opacity: 0,
          margin: '0 0 64px 0',
          maxWidth: 720,
          textAlign: 'center',
          lineHeight: 1.45,
        }}
      >
        I&apos;m your AI tutor for {levelLabel}. Speak naturally — we&apos;ll have a conversation.
      </p>

      <button
        ref={btnRef}
        onClick={onStart}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="font-display"
        style={{
          width: 440,
          height: 92,
          borderRadius: '999px',
          background: 'linear-gradient(135deg, var(--accent-voice) 0%, color-mix(in srgb, var(--accent-voice) 70%, #60A5FA) 100%)',
          color: '#0A0A0A',
          fontSize: 30,
          fontWeight: 700,
          border: 'none',
          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 12px 40px rgba(52, 211, 153, 0.32)',
          cursor: 'pointer',
          opacity: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        Start conversation
      </button>

      <div
        ref={micCaveatRef}
        className="font-mono"
        style={{
          fontSize: 18,
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          opacity: 0,
          marginTop: 32,
          letterSpacing: '0.12em',
        }}
      >
        Microphone permission required
      </div>
    </div>
  )
}
