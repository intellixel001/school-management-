'use client'

import { useRef, useEffect, useState } from 'react'
import gsap from 'gsap'
import { ChevronDown } from 'lucide-react'
import { prefersReducedMotion } from '@/lib/gsap'
import type { ModeConfig } from './modes.config'

interface ModeInfoRowProps {
  config: ModeConfig
  isOpen: boolean
  isActive: boolean
  onToggle: () => void
  onPointerDown: () => void
  onPointerUp: () => void
  onStart: () => void
}

export default function ModeInfoRow({
  config,
  isOpen,
  isActive,
  onToggle,
  onPointerDown,
  onPointerUp,
  onStart,
}: ModeInfoRowProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const chevronRef = useRef<SVGSVGElement>(null)
  const bgRef = useRef<HTMLDivElement>(null)
  
  const [isPressed, setIsPressed] = useState(false)

  useEffect(() => {
    const isReduced = prefersReducedMotion()
    const content = contentRef.current
    const chevron = chevronRef.current
    if (!content || !chevron) return

    if (isOpen) {
      if (isReduced) {
        gsap.set(content, { height: 'auto', opacity: 1 })
        gsap.set(chevron, { rotation: 180 })
      } else {
        gsap.to(content, { height: content.scrollHeight, opacity: 1, duration: 0.42, ease: 'power2.inOut', onComplete: () => {
          gsap.set(content, { height: 'auto' })
        }})
        gsap.to(chevron, { rotation: 180, duration: 0.42, ease: 'power2.inOut' })
      }
    } else {
      if (isReduced) {
        gsap.set(content, { height: 0, opacity: 0 })
        gsap.set(chevron, { rotation: 0 })
      } else {
        gsap.to(content, { height: 0, opacity: 0, duration: 0.42, ease: 'power2.inOut' })
        gsap.to(chevron, { rotation: 0, duration: 0.42, ease: 'power2.inOut' })
      }
    }
  }, [isOpen])

  useEffect(() => {
    const isReduced = prefersReducedMotion()
    if (!bgRef.current) return
    
    const targetBg = (isActive || isPressed || isOpen) ? 'rgba(30, 18, 13, 0.72)' : 'rgba(22, 13, 10, 0.55)'
    
    if (isReduced) {
      gsap.set(bgRef.current, { backgroundColor: targetBg })
      return
    }
    gsap.to(bgRef.current, { backgroundColor: targetBg, duration: 0.14, ease: 'power2.out' })
  }, [isActive, isPressed, isOpen])

  const handlePointerDown = () => {
    setIsPressed(true)
    onPointerDown()
  }
  const handlePointerUp = () => {
    setIsPressed(false)
    onPointerUp()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onToggle()
    }
  }

  const handleStartKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      e.stopPropagation()
      onStart()
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-expanded={isOpen}
      onClick={onToggle}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={handlePointerUp}
      className="mode-info-row"
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        minHeight: 104,
        borderRadius: 12,
        border: '1px solid rgba(198, 158, 92, 0.18)',
        outline: 'none',
        cursor: 'pointer',
        overflow: 'hidden',
        marginBottom: 16
      }}
    >
      <div
        ref={bgRef}
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(22, 13, 10, 0.55)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          backgroundColor: config.accent,
          opacity: (isActive || isPressed || isOpen) ? 1 : 0.55,
          transition: 'opacity 140ms ease',
          zIndex: 1,
        }}
      />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', padding: '0 32px', minHeight: 104 }}>
        <h3 className="font-display" style={{ fontWeight: 700, fontSize: 34, color: '#F5EDD8', minWidth: 280, margin: 0 }}>
          {config.title}
        </h3>
        <p className="font-body" style={{ fontSize: 22, color: 'rgba(245, 237, 216, 0.6)', margin: 0, flex: 1 }}>
          {config.teaser}
        </p>
        <ChevronDown ref={chevronRef} size={32} color="rgba(245, 237, 216, 0.5)" />
      </div>

      <div ref={contentRef} style={{ height: 0, overflow: 'hidden', position: 'relative', zIndex: 1 }}>
        <div style={{ padding: '0 32px 32px 32px' }}>
          <p className="font-body" style={{ fontSize: 24, color: 'rgba(245, 237, 216, 0.82)', maxWidth: '70ch', marginTop: 16, marginBottom: 32 }}>
            {config.description}
          </p>

          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap' }}>
              {config.facts.map((fact, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span className="font-mono" style={{ fontSize: 15, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(245,237,216,0.45)' }}>
                    {fact.label}
                  </span>
                  <span className="font-body" style={{ fontSize: 22, color: '#F5EDD8' }}>
                    {fact.value}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation()
                onStart()
              }}
              onKeyDown={handleStartKeyDown}
              onPointerDown={(e) => {
                e.stopPropagation() // Don't press the row when pressing the button
                e.currentTarget.style.transform = 'scale(0.96)'
                e.currentTarget.style.filter = 'brightness(1.1)'
              }}
              onPointerUp={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
                e.currentTarget.style.filter = 'brightness(1)'
              }}
              onPointerLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
                e.currentTarget.style.filter = 'brightness(1)'
              }}
              style={{
                height: 72,
                padding: '0 40px',
                borderRadius: 10,
                backgroundColor: config.accent,
                color: (config.id === 'practice' || config.id === 'voice') ? '#1A0F07' : '#FFF3EC',
                border: 'none',
                outline: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 100ms ease, filter 100ms ease',
              }}
            >
              <span className="font-display" style={{ fontWeight: 700, fontSize: 26 }}>Start</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
