'use client'

import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { prefersReducedMotion } from '@/lib/gsap'

type VoiceState = 'connecting' | 'idle' | 'connected' | 'user_speaking' | 'ai_speaking' | 'thinking' | 'error' | 'ended'

interface VoiceOrbProps {
  state: VoiceState
  getAmplitude?: () => number
  size?: number
}

const STATE_COLORS: Record<VoiceState, { hex: string, soft: string }> = {
  connecting: { hex: '#FBBF24', soft: 'rgba(251, 191, 36, 0.5)' },
  idle: { hex: '#A5B4FC', soft: 'rgba(165, 180, 252, 0.5)' },
  connected: { hex: '#A5B4FC', soft: 'rgba(165, 180, 252, 0.5)' },
  user_speaking: { hex: '#60A5FA', soft: 'rgba(96, 165, 250, 0.5)' },
  ai_speaking: { hex: '#34D399', soft: 'rgba(52, 211, 153, 0.5)' },
  thinking: { hex: '#FCD34D', soft: 'rgba(252, 211, 77, 0.5)' },
  error: { hex: '#F87171', soft: 'rgba(248, 113, 113, 0.5)' },
  ended: { hex: '#94A3B8', soft: 'rgba(148, 163, 184, 0.5)' },
}

export default function VoiceOrb({ state, getAmplitude, size = 480 }: VoiceOrbProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const auraRingRef = useRef<SVGCircleElement>(null)
  const breathTweenRef = useRef<gsap.core.Tween | null>(null)
  
  const smoothedAmplitudeRef = useRef(0)

  // Initialization
  useEffect(() => {
    if (!containerRef.current) return
    const container = containerRef.current
    
    // Set initial CSS vars directly
    const initialColor = STATE_COLORS['idle']
    container.style.setProperty('--pulse-color', initialColor.hex)
    container.style.setProperty('--pulse-color-soft', initialColor.soft)
    container.style.setProperty('--pulse-intensity', '0.4')
    container.style.setProperty('--pulse-scale', '1')

    if (prefersReducedMotion()) return

    // Aura ring continuous rotation (60s)
    if (auraRingRef.current) {
      gsap.to(auraRingRef.current, {
        rotation: 360,
        transformOrigin: 'center center',
        duration: 60,
        ease: 'none',
        repeat: -1
      })
    }
  }, [])

  // State color transitions and breath
  useEffect(() => {
    if (!containerRef.current) return
    const container = containerRef.current
    const targetColor = STATE_COLORS[state] || STATE_COLORS.idle

    // Color crossfade
    gsap.to(container, {
      '--pulse-color': targetColor.hex,
      '--pulse-color-soft': targetColor.soft,
      duration: 0.8,
      ease: 'power2.inOut'
    })

    if (prefersReducedMotion()) return

    // Idle breath
    if (breathTweenRef.current) {
      breathTweenRef.current.kill()
    }

    if (state === 'idle' || state === 'connected') {
      // 5-second cycle
      breathTweenRef.current = gsap.to(container, {
        '--pulse-scale': 1.03,
        '--pulse-intensity': 0.55,
        duration: 2.5,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1
      })
    } else {
      // Return to baseline for speaking states (audio handles scale)
      gsap.to(container, {
        '--pulse-scale': 1,
        '--pulse-intensity': 0.4,
        duration: 0.8,
        ease: 'power2.out'
      })
    }
  }, [state])

  // Audio reactivity
  useEffect(() => {
    if (!containerRef.current || !getAmplitude) return
    
    let rafId: number
    const isReduced = prefersReducedMotion()

    const updateLoop = () => {
      const isSpeaking = state === 'user_speaking' || state === 'ai_speaking'
      
      if (isSpeaking) {
        const rawAmp = getAmplitude()
        // Low pass filter
        smoothedAmplitudeRef.current = smoothedAmplitudeRef.current * 0.85 + rawAmp * 0.15
        const amp = smoothedAmplitudeRef.current

        // Subtly modulate CSS variables
        if (!isReduced) {
          containerRef.current!.style.setProperty('--pulse-scale', (1.0 + amp * 0.06).toString())
          containerRef.current!.style.setProperty('--pulse-intensity', (0.5 + amp * 0.5).toString())
        } else {
          containerRef.current!.style.setProperty('--pulse-scale', (1.0 + amp * 0.03).toString())
        }
      } else {
        // Decay the smoothed amplitude when not speaking to avoid sudden jumps
        smoothedAmplitudeRef.current = smoothedAmplitudeRef.current * 0.9
      }
      
      rafId = requestAnimationFrame(updateLoop)
    }

    rafId = requestAnimationFrame(updateLoop)
    return () => cancelAnimationFrame(rafId)
  }, [state, getAmplitude])

  // End state collapse logic happens from parent (page.tsx) animating the container's transform

  return (
    <div 
      ref={containerRef}
      className="voice-orb-container"
      style={{
        position: 'relative',
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        // Expose variables for SVG elements below
        transform: 'scale(var(--pulse-scale, 1))',
        willChange: 'transform'
      }}
    >
      {/* 1. Outer halo (600px square, heavy blur) */}
      <div 
        style={{
          position: 'absolute',
          width: 600,
          height: 600,
          background: 'radial-gradient(circle at center, var(--pulse-color) 0%, transparent 70%)',
          filter: 'blur(80px)',
          opacity: 'var(--pulse-intensity, 0.4)',
          pointerEvents: 'none',
          willChange: 'opacity'
        }}
      />

      {/* 2. Aura ring (360px SVG circle with dash) */}
      <svg 
        width={400} 
        height={400} 
        viewBox="0 0 400 400" 
        style={{ position: 'absolute', pointerEvents: 'none' }}
      >
        <circle 
          ref={auraRingRef}
          cx="200" 
          cy="200" 
          r="180" 
          fill="none" 
          stroke="var(--pulse-color)" 
          strokeWidth="1"
          opacity="0.3"
          strokeDasharray="1000 120" /* One thin dash gap */
          strokeLinecap="round"
        />
      </svg>

      {/* 3 & 4. Sphere body & Soft rim (280px) */}
      <svg 
        width={300} 
        height={300} 
        viewBox="0 0 300 300" 
        style={{ position: 'absolute', pointerEvents: 'none' }}
      >
        <defs>
          <radialGradient id="sphere-gradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <stop offset="0%" stopColor="var(--pulse-color)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="var(--pulse-color)" stopOpacity="0.5" />
          </radialGradient>
        </defs>
        
        {/* Sphere body */}
        <circle 
          cx="150" 
          cy="150" 
          r="140" 
          fill="url(#sphere-gradient)" 
        />
        
        {/* Soft rim */}
        <circle 
          cx="150" 
          cy="150" 
          r="140" 
          fill="none"
          stroke="var(--pulse-color-soft)" 
          strokeWidth="1.5"
          opacity="0.5"
        />
      </svg>
    </div>
  )
}
