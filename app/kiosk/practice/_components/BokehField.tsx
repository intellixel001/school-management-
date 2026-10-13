'use client'

import React, { useEffect, useRef } from 'react'
import { prefersReducedMotion } from '@/lib/gsap'

interface Orb {
  x: number
  y: number
  radius: number
  depth: number
  colorBase: string
  driftX: number
  driftY: number
  phaseOffset: number
}

const PALETTE = [
  '196, 181, 253', // soft violet
  '252, 211, 77',  // warm amber
  '244, 244, 245', // soft white
  '167, 139, 250', // deeper violet
  '254, 215, 170', // peach
]

export default function BokehField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return

    let width = window.innerWidth
    let height = window.innerHeight
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.scale(dpr, dpr)
    }

    resize()
    window.addEventListener('resize', resize)

    // Generate orbs
    const orbs: Orb[] = Array.from({ length: 25 }).map(() => {
      const depth = Math.random()
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        radius: 40 + depth * 80,
        depth,
        colorBase: PALETTE[Math.floor(Math.random() * PALETTE.length)],
        driftX: (Math.random() - 0.5) * 0.15 * depth,
        driftY: (Math.random() - 0.5) * 0.15 * depth,
        phaseOffset: Math.random() * Math.PI * 2,
      }
    })

    const isReducedMotion = prefersReducedMotion()
    let animationFrameId: number
    let lastTime = performance.now()

    const draw = (time: number) => {
      // Clear with solid #060814
      ctx.fillStyle = '#060814'
      ctx.fillRect(0, 0, width, height)

      // Time for phase pulsing
      const t = time * 0.001

      orbs.forEach((orb) => {
        // Update positions if not reduced motion
        if (!isReducedMotion) {
          orb.x += orb.driftX
          orb.y += orb.driftY

          // Wrap around edges
          if (orb.x < -orb.radius) orb.x = width + orb.radius
          if (orb.x > width + orb.radius) orb.x = -orb.radius
          if (orb.y < -orb.radius) orb.y = height + orb.radius
          if (orb.y > height + orb.radius) orb.y = -orb.radius
        }

        // Pulse alpha slowly over 12 + phaseOffset seconds
        // range of multiplier: 0.7 to 1.3 roughly
        const pulse = isReducedMotion ? 1 : 0.85 + Math.sin(t * (2 * Math.PI / (12 + orb.phaseOffset))) * 0.15
        const maxAlpha = orb.depth * 0.18
        const currentAlpha = Math.min(Math.max(maxAlpha * pulse, 0.01), 1)

        const gradient = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.radius)
        gradient.addColorStop(0, `rgba(${orb.colorBase}, ${currentAlpha.toFixed(3)})`)
        gradient.addColorStop(1, `rgba(${orb.colorBase}, 0)`)

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2)
        ctx.fill()
      })

      if (!isReducedMotion) {
        animationFrameId = requestAnimationFrame(draw)
      }
    }

    // Initial draw
    draw(performance.now())

    // Pause RAF when document hidden
    const handleVisibilityChange = () => {
      if (isReducedMotion) return
      if (document.hidden) {
        cancelAnimationFrame(animationFrameId)
      } else {
        lastTime = performance.now()
        animationFrameId = requestAnimationFrame(draw)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (animationFrameId) cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  )
}
