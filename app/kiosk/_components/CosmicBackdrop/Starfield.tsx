'use client'

import { useRef, useEffect } from 'react'
import { gsap, PREFERS_REDUCED_MOTION } from '@/lib/gsap'

interface StarfieldProps {
  density?: 'full' | 'card' | 'minimal'
}

interface Star {
  x: number
  y: number
  radius: number
  color: string
  twinklePhase: number
  twinkleSpeed: number // rad/sec
  driftSpeed: number   // px/sec
}

export default function Starfield({ density = 'full' }: StarfieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = window.innerWidth
    let height = window.innerHeight
    let dpr = window.devicePixelRatio || 1

    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      dpr = window.devicePixelRatio || 1
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.scale(dpr, dpr)
    }
    
    resize()
    window.addEventListener('resize', resize)

    // Setup stars
    const count = density === 'full' ? 150 : density === 'card' ? 100 : 60
    const stars: Star[] = []

    for (let i = 0; i < count; i++) {
      const rand = Math.random()
      let radius = 0.5 + Math.random() * 0.5 // tiny (60%)
      if (rand > 0.6 && rand <= 0.9) radius = 1 + Math.random() * 1 // small (30%)
      if (rand > 0.9) radius = 2 + Math.random() * 1 // medium (10%)

      const colorRand = Math.random()
      let color = '255, 255, 255' // white
      if (colorRand > 0.8 && colorRand <= 0.9) color = '224, 255, 255' // pale cyan
      if (colorRand > 0.9) color = '255, 255, 224' // pale yellow

      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius,
        color,
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleSpeed: (Math.PI * 2) / (2 + Math.random() * 3), // 2-5s period
        driftSpeed: (100 / (10 + Math.random() * 10)) * (radius / 2), // 10-20s per 100px, bigger stars move faster
      })
    }

    const draw = (time: number) => {
      ctx.clearRect(0, 0, width, height)
      
      const t = PREFERS_REDUCED_MOTION ? 0 : time

      for (let i = 0; i < stars.length; i++) {
        const star = stars[i]
        
        // Drift
        let x = star.x - (t * star.driftSpeed)
        // Wrap around
        x = ((x % width) + width) % width

        // Twinkle (0.4 to 1.0)
        let alpha = 1
        if (!PREFERS_REDUCED_MOTION) {
          alpha = 0.4 + 0.6 * ((Math.sin(star.twinklePhase + t * star.twinkleSpeed) + 1) / 2)
        }

        ctx.beginPath()
        ctx.arc(x, star.y, star.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${star.color}, ${alpha})`
        ctx.fill()
      }
    }

    if (PREFERS_REDUCED_MOTION) {
      draw(0) // Draw once
    } else {
      gsap.ticker.add(draw)
    }

    return () => {
      window.removeEventListener('resize', resize)
      gsap.ticker.remove(draw)
    }
  }, [density])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ width: '100%', height: '100%' }}
    />
  )
}
