'use client'

import { useEffect, useRef } from 'react'
import { gsap, prefersReducedMotion } from '@/lib/gsap'
import { WORDS } from './words.config'

type ParticleType = 'dot' | 'letter' | 'speck'

interface Particle {
  id: number
  type: ParticleType
  x: number
  y: number
  vx: number
  vy: number
  opacity: number
  maxOpacity: number
  life: number
  maxLife: number
  
  // Type-specific
  r?: number // for dot/speck
  char?: string // original letter
  renderChar?: string // currently rendering letter (might be overridden)
  fontSize?: number
  rotation: number
  rotationSpeed: number
  
  state: 'drifting' | 'forming' | 'formed' | 'releasing'
}

export function PoeticParticles({ avoidSelectors = ['.library-prop'] }: { avoidSelectors?: string[] } = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const isReduced = prefersReducedMotion()
    
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    const particles: Particle[] = []
    let nextId = 0
    let wordTimeout: ReturnType<typeof setTimeout> | null = null
    const activeTweens: gsap.core.Tween[] = []
    let formedWordParticles: Particle[] = []
    const networkState = { opacity: 0 }

    // Letters only — no background dots/specks. More letters keeps the field
    // alive and ensures there are always enough nearby to form a word.
    const LETTER_COUNT = 22

    const ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    const createParticle = (type: ParticleType): Particle => {
      const p: Particle = {
        id: nextId++,
        type,
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -0.1 - Math.random() * 0.3,
        opacity: 0,
        maxOpacity: type === 'dot' ? 0.35 : (type === 'speck' ? 0.5 : 0.35),
        life: 0,
        maxLife: 300 + Math.random() * 600,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: ((Math.random() - 0.5) * 0.4) * (Math.PI / 180), // rads per frame
        state: 'drifting'
      }

      if (type === 'dot') {
        p.r = 1.5 + Math.random() * 2.5
      } else if (type === 'speck') {
        p.r = 0.5 + Math.random() * 1.5
        p.vx *= 0.5 // drift slower
        p.vy *= 0.5
      } else if (type === 'letter') {
        p.char = ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
        p.renderChar = p.char
        p.fontSize = 14 + Math.random() * 8
      }

      return p
    }

    const init = () => {
      resize()
      for (let i = 0; i < LETTER_COUNT; i++) particles.push(createParticle('letter'))

      particles.forEach(p => { p.life = Math.random() * p.maxLife })
    }

    const scheduleNextWord = () => {
      if (isReduced) return // No word formation in reduced motion
      const delay = 8000 + Math.random() * 4000 // 8-12s
      wordTimeout = setTimeout(formWord, delay)
    }

    const formWord = () => {
      // Pick word
      const word = WORDS[Math.floor(Math.random() * WORDS.length)]
      
      // Find eligible letters (drifting)
      const eligible = particles.filter(p => p.type === 'letter' && p.state === 'drifting')
      if (eligible.length < word.length) {
        // Not enough drifting letters, skip and try later
        scheduleNextWord()
        return
      }

      // Formed word display parameters
      const FORMED_FONT_SIZE = 35
      const LETTER_SPACING = FORMED_FONT_SIZE * 0.7
      const wordWidth = (word.length - 1) * LETTER_SPACING
      const halfHeight = FORMED_FONT_SIZE * 0.65

      // Avoidance exclusion zones — measure the real bounding boxes in the DOM
      const propBoxes: { minX: number; maxX: number; minY: number; maxY: number }[] = []
      avoidSelectors.forEach(sel => {
        document.querySelectorAll(sel).forEach(el => {
          const rect = el.getBoundingClientRect()
          // Add a small padding so words don't hug the edges
          propBoxes.push({
            minX: rect.left - 20,
            maxX: rect.right + 20,
            minY: rect.top - 20,
            maxY: rect.bottom + 20
          })
        })
      })

      // Collect several valid center candidates (avoiding wordmark zone AND all
      // props), then keep the one closest to an existing cluster of letters.
      // A single random center can land far from every drifting letter, which
      // forces one of them to streak across the screen to reach the word.
      const candidates: { x: number; y: number }[] = []
      let attempts = 0
      const halfWord = wordWidth / 2 + FORMED_FONT_SIZE * 0.5
      while (candidates.length < 16 && attempts++ < 200) {
        // Favor the horizontal center since corners are occupied by props
        let cX
        if (Math.random() < 0.7) {
          cX = canvas.width * 0.5 + (Math.random() - 0.5) * (canvas.width * 0.4)
        } else {
          cX = halfWord + Math.random() * (canvas.width - halfWord * 2)
        }

        const cY = canvas.height * (0.12 + Math.random() * 0.76)

        // Avoid wordmark (middle 35-65% vertical band)
        // Keep this generic band only on the homepage (where avoidSelectors is the default).
        if (avoidSelectors.length === 1 && avoidSelectors[0] === '.library-prop') {
          const yPct = cY / canvas.height
          if (yPct > 0.35 && yPct < 0.65) continue
        }

        // Avoid overlapping any prop's bounding box
        const wordMinX = cX - wordWidth / 2 - FORMED_FONT_SIZE * 0.4
        const wordMaxX = cX + wordWidth / 2 + FORMED_FONT_SIZE * 0.4
        const wordMinY = cY - halfHeight
        const wordMaxY = cY + halfHeight
        const collides = propBoxes.some(b =>
          wordMaxX > b.minX && wordMinX < b.maxX &&
          wordMaxY > b.minY && wordMinY < b.maxY
        )
        if (collides) continue

        candidates.push({ x: cX, y: cY })
      }

      // If we couldn't find a clean spot after 200 tries, skip this cycle
      if (candidates.length === 0) {
        scheduleNextWord()
        return
      }

      // For each candidate center: take the nearest letters, assign them to
      // word slots left-to-right (shortest, non-crossing paths), and measure
      // the worst flight distance. Keep the candidate with the smallest one.
      let best: { x: number; y: number; picked: Particle[]; worst: number } | null = null
      for (const c of candidates) {
        const nearest = [...eligible].sort((a, b) => {
          const distA = (a.x - c.x) ** 2 + (a.y - c.y) ** 2
          const distB = (b.x - c.x) ** 2 + (b.y - c.y) ** 2
          return distA - distB
        })
        const cPicked = nearest.slice(0, word.length).sort((a, b) => a.x - b.x)
        const cStartX = c.x - wordWidth / 2
        let worst = 0
        cPicked.forEach((p, i) => {
          worst = Math.max(worst, Math.hypot(cStartX + i * LETTER_SPACING - p.x, c.y - p.y))
        })
        if (!best || worst < best.worst) best = { x: c.x, y: c.y, picked: cPicked, worst }
      }

      const centerX = best!.x
      const centerY = best!.y
      const picked = best!.picked

      const startX = centerX - wordWidth / 2

      formedWordParticles = picked
      networkState.opacity = 0

      activeTweens.push(
        gsap.to(networkState, {
          opacity: 1,
          duration: 0.9,
          ease: 'power2.inOut'
        })
      )

      // Cap perceived flight speed: power3.inOut peaks at ~3x the average
      // velocity, so duration scales with distance. ~20% of screen width per
      // second reads as a graceful glide on any resolution; a fixed 0.9s
      // turned long flights into a letter streaking across the screen.
      const EASE_PEAK_FACTOR = 3
      const maxPeakSpeed = canvas.width * 0.2 // px per second
      let slowestFlight = 0.9

      picked.forEach((p, i) => {
        p.state = 'forming'
        p.renderChar = word[i]

        // Normalize rotation to nearest angle so it doesn't spin wildly across the screen
        p.rotation = p.rotation % (Math.PI * 2)
        if (p.rotation > Math.PI) p.rotation -= Math.PI * 2
        if (p.rotation < -Math.PI) p.rotation += Math.PI * 2

        const targetX = startX + i * LETTER_SPACING
        const targetY = centerY

        const dist = Math.hypot(targetX - p.x, targetY - p.y)
        const flightDur = Math.min(3.0, Math.max(0.9, (dist * EASE_PEAK_FACTOR) / maxPeakSpeed))
        slowestFlight = Math.max(slowestFlight, flightDur)

        // Tween in — position, rotation, opacity, and fontSize all together
        activeTweens.push(
          gsap.to(p, {
            x: targetX,
            y: targetY,
            rotation: 0,
            opacity: 0.8,
            fontSize: FORMED_FONT_SIZE,
            duration: flightDur,
            ease: 'power3.inOut',
            onComplete: () => { p.state = 'formed' }
          })
        )
      })

      // Hold for 3.2s, then release
      wordTimeout = setTimeout(() => {
        activeTweens.push(
          gsap.to(networkState, {
            opacity: 0,
            duration: 0.5,
            ease: 'power2.out',
            onComplete: () => {
              formedWordParticles = []
            }
          })
        )

        picked.forEach(p => {
          p.state = 'releasing'
          const releaseSize = 14 + Math.random() * 8
          activeTweens.push(
            gsap.to(p, {
              opacity: 0.35,
              fontSize: releaseSize,
              duration: 1.1,
              ease: 'power2.out',
              onComplete: () => {
                p.state = 'drifting'
                p.renderChar = p.char
                // Reset life to peak (0.5) so it matches the 0.35 opacity and doesn't instantly die/teleport
                p.life = p.maxLife * 0.5
                // Gentle drift kick — matches natural drift range so letters don't burst out.
                // vx close to natural (±0.15) and vy biased upward like new particles (-0.4 to -0.1).
                p.vx = (Math.random() - 0.5) * 0.3
                p.vy = -0.1 - Math.random() * 0.3
              }
            })
          )
        })
        scheduleNextWord()
      }, slowestFlight * 1000 + 3200) // longest flight + 3.2s hold
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // Draw constellation network lines behind particles
      if (networkState.opacity > 0 && formedWordParticles.length > 1) {
        ctx.save()
        ctx.globalAlpha = networkState.opacity
        ctx.strokeStyle = 'rgba(232, 185, 108, 0.45)'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        
        // Connect adjacent letters
        for (let i = 0; i < formedWordParticles.length - 1; i++) {
          ctx.moveTo(formedWordParticles[i].x, formedWordParticles[i].y)
          ctx.lineTo(formedWordParticles[i+1].x, formedWordParticles[i+1].y)
        }
        
        // Connect alternating letters for a web-like look
        for (let i = 0; i < formedWordParticles.length - 2; i++) {
          ctx.moveTo(formedWordParticles[i].x, formedWordParticles[i].y)
          ctx.lineTo(formedWordParticles[i+2].x, formedWordParticles[i+2].y)
        }

        ctx.stroke()
        ctx.restore()
      }

      particles.forEach((p, index) => {
        if (p.state === 'drifting') {
          // --- Safety guards (kiosk runs 24/7; never let a particle glitch) ---
          // 1. NaN guard: a NaN x/y never satisfies the bounds check below, so a
          //    corrupted particle would render erratically forever. Respawn it.
          if (!Number.isFinite(p.x) || !Number.isFinite(p.y) ||
              !Number.isFinite(p.vx) || !Number.isFinite(p.vy)) {
            particles[index] = createParticle(p.type)
            return
          }
          // 2. Speed clamp: natural drift speed is ~0.4 px/frame. If a stale/killed
          //    GSAP tween or any edge leaves a particle with high velocity, it would
          //    race to an edge, respawn at a random spot, and race again — reading as
          //    "one letter zipping all over the screen". Clamp magnitude so that is
          //    structurally impossible.
          const MAX_SPEED = 0.6
          const speed = Math.hypot(p.vx, p.vy)
          if (speed > MAX_SPEED) {
            const k = MAX_SPEED / speed
            p.vx *= k
            p.vy *= k
          }

          p.x += p.vx
          p.y += p.vy
          p.rotation += p.rotationSpeed
          p.life++

          // Friction to calm down after a kick
          p.vx += (0 - p.vx) * 0.02
          p.vy += (-0.2 - p.vy) * 0.02 // return to slight upward drift

          // THE FLASH BUG: on the letter's final frame life can slightly
          // exceed maxLife, making sin(lifePercent·π) NEGATIVE. Assigning a
          // negative value to ctx.globalAlpha is silently IGNORED by the
          // canvas, so the dying letter rendered at FULL opacity for one
          // frame — a bright flash at a random spot every few seconds.
          // Clamp to zero so the fade-out can never overshoot.
          const lifePercent = p.life / p.maxLife
          p.opacity = Math.max(0, Math.sin(Math.min(1, lifePercent) * Math.PI)) * p.maxOpacity

          // Fade to zero near the canvas edges. Letters drift upward and get
          // culled at the bounds — without this fade a letter is deleted while
          // still ~1/3 visible, which reads as a letter "flashing" out of
          // existence at a random edge spot every few seconds.
          const EDGE_FADE = 80 // px
          const edgeDist = Math.min(p.x, p.y, canvas.width - p.x, canvas.height - p.y)
          p.opacity *= Math.min(1, Math.max(0, edgeDist / EDGE_FADE))

          if (p.life >= p.maxLife || p.x < 0 || p.x > canvas.width || p.y < 0 || p.y > canvas.height) {
            particles[index] = createParticle(p.type)
          }
        }

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)

        // globalAlpha silently ignores values outside [0,1] (leaving it at
        // 1.0 = full opacity), so never trust p.opacity raw here.
        ctx.globalAlpha = Number.isFinite(p.opacity) ? Math.min(1, Math.max(0, p.opacity)) : 0

        if (p.type === 'letter' && p.renderChar) {
          const isProminent = p.state === 'forming' || p.state === 'formed' || p.state === 'releasing'
          ctx.font = `${isProminent ? '600 ' : ''}${p.fontSize}px Georgia, "Times New Roman", serif`
          ctx.fillStyle = 'rgba(232, 185, 108, 1)'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.filter = isProminent ? 'none' : 'blur(0.5px)'
          ctx.fillText(p.renderChar, 0, 0)
        } else {
          ctx.beginPath()
          ctx.arc(0, 0, p.r || 2, 0, Math.PI * 2)
          if (p.type === 'speck') {
            ctx.fillStyle = 'rgba(180, 120, 60, 1)' // darker sepia
          } else {
            ctx.fillStyle = 'rgba(232, 185, 108, 1)' // warm amber
          }
          ctx.fill()
        }
        
        ctx.restore()
      })

      animationFrameId = requestAnimationFrame(draw)
    }

    window.addEventListener('resize', resize)
    init()
    draw()
    scheduleNextWord()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animationFrameId)
      if (wordTimeout) clearTimeout(wordTimeout)
      activeTweens.forEach(t => t.kill())
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none w-full h-full"
      style={{ opacity: 0, zIndex: 7 }} // Opacity managed by parent timeline
      id="poetic-particles-canvas"
    />
  )
}
