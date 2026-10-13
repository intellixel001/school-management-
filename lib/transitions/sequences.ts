import { gsap, prefersReducedMotion } from '@/lib/gsap'
import type { TransitionParams } from './types'

function crossFade(overlayEl: HTMLDivElement, durationMs: number): Promise<void> {
  return new Promise((resolve) => {
    gsap.fromTo(overlayEl,
      { opacity: 0, visibility: 'visible', backgroundColor: '#0F0813' },
      {
        opacity: 1,
        duration: durationMs / 2000,
        onComplete: () => {
          // Resolve immediately so the router push can happen under the black screen
          resolve()
        }
      }
    )
  })
}

export async function pinToMenu(overlayEl: HTMLDivElement, params: TransitionParams): Promise<void> {
  if (prefersReducedMotion()) return crossFade(overlayEl, 200)

  return new Promise((resolve) => {
    gsap.set(overlayEl, { visibility: 'visible', backgroundColor: 'transparent', opacity: 1 })
    
    const burstOrigin = params.burstOrigin || { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    const particleCount = 80
    const particles: HTMLDivElement[] = []
    
    const flash = document.createElement('div')
    flash.style.position = 'absolute'
    flash.style.width = '100px'
    flash.style.height = '100px'
    flash.style.borderRadius = '50%'
    flash.style.left = `${burstOrigin.x - 50}px`
    flash.style.top = `${burstOrigin.y - 50}px`
    flash.style.background = 'radial-gradient(circle, #fff 0%, transparent 70%)'
    flash.style.opacity = '0'
    overlayEl.appendChild(flash)

    for (let i = 0; i < particleCount; i++) {
      const p = document.createElement('div')
      p.style.position = 'absolute'
      p.style.width = '6px'
      p.style.height = '6px'
      p.style.borderRadius = '50%'
      // Warm library palette — amber embers with cream sparks.
      const isSecondary = Math.random() > 0.7
      const color = isSecondary ? '#FBF3E2' : '#E8B96C'
      p.style.backgroundColor = color
      p.style.boxShadow = `0 0 12px ${color}`
      p.style.top = '0'
      p.style.left = '0'
      p.style.transformOrigin = 'center bottom'
      gsap.set(p, { x: burstOrigin.x - 3, y: burstOrigin.y - 3, scaleY: 1, scaleX: 1, opacity: 1 })
      overlayEl.appendChild(p)
      particles.push(p)
    }

    const tl = gsap.timeline({
      onComplete: () => {
        particles.forEach(p => p.remove())
        flash.remove()
      }
    })

    tl.to(flash, { opacity: 1, scale: 2, duration: 0.05, ease: 'power2.out' }, 0)
    tl.to(flash, { opacity: 0, duration: 0.1, ease: 'power2.in' }, 0.05)

    const diagonal = Math.sqrt(window.innerWidth ** 2 + window.innerHeight ** 2)
    
    particles.forEach((p) => {
      const angle = Math.random() * Math.PI * 2
      const distance = diagonal * (0.8 + Math.random() * 1.5)
      const duration = 0.5 + Math.random() * 0.2
      const dx = Math.cos(angle) * distance
      const dy = Math.sin(angle) * distance
      const rotationDeg = (angle * 180) / Math.PI + 90

      tl.to(p, {
        x: burstOrigin.x - 3 + dx,
        y: burstOrigin.y - 3 + dy,
        scaleY: 8,
        rotation: rotationDeg,
        duration,
        ease: 'power3.in',
      }, 0)
    })

    setTimeout(resolve, 600)
  })
}

export async function menuToVoice(overlayEl: HTMLDivElement, params: TransitionParams, cardClone: HTMLElement): Promise<void> {
  if (prefersReducedMotion()) return crossFade(overlayEl, 200)

  return new Promise((resolve) => {
    gsap.set(overlayEl, { visibility: 'visible', backgroundColor: 'transparent', opacity: 1 })
    
    const tl = gsap.timeline()
    const rect = params.sourceRect || { top: window.innerHeight / 2 - 200, left: window.innerWidth / 2 - 150, width: 300, height: 400 }
    
    // We don't want to blur the actual cloned DOM nodes because backdrop filters and text
    // create a "double vision" dark smudge effect. We'll just fade the clone out slightly 
    // while scaling, and use a pure energy box to create the blowout.
    gsap.set(cardClone, {
      position: 'absolute',
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      borderRadius: '24px',
      margin: 0,
      zIndex: 10,
      transformOrigin: 'center center'
    })

    // Remove backdrop filters from clone to prevent double-darkening the background
    cardClone.style.backdropFilter = 'none'
    cardClone.style.setProperty('-webkit-backdrop-filter', 'none')
    cardClone.style.background = 'transparent'
    cardClone.style.border = 'none'
    cardClone.style.boxShadow = 'none'

    window.dispatchEvent(new CustomEvent('menu:transition-accelerate'))

    tl.to(cardClone, {
      scale: 1.1,
      opacity: 0,
      duration: 0.4,
      ease: 'power2.out'
    }, 0)

    // Pure energy box to create the glowing blowout
    const energyBox = document.createElement('div')
    energyBox.style.position = 'absolute'
    energyBox.style.top = `${rect.top}px`
    energyBox.style.left = `${rect.left}px`
    energyBox.style.width = `${rect.width}px`
    energyBox.style.height = `${rect.height}px`
    energyBox.style.borderRadius = '24px'
    // Voice mode's cool AI accent, matches the vitrine and orb.
    energyBox.style.background = '#7C9BD9'
    energyBox.style.boxShadow = '0 0 120px 40px #7C9BD9'
    energyBox.style.opacity = '0'
    energyBox.style.zIndex = '11'
    overlayEl.appendChild(energyBox)

    tl.to(energyBox, {
      opacity: 1,
      scale: 1.2,
      duration: 0.3,
      ease: 'power2.out'
    }, 0)
    tl.to(energyBox, {
      opacity: 0,
      scale: 1.4,
      duration: 0.3,
      ease: 'power2.in'
    }, 0.3)

    const darkWash = document.createElement('div')
    darkWash.style.position = 'absolute'
    darkWash.style.inset = '0'
    darkWash.style.background = 'radial-gradient(circle at center, #1A0F2E 0%, #0F0813 100%)'
    darkWash.style.opacity = '0'
    darkWash.style.zIndex = '5'
    overlayEl.appendChild(darkWash)

    tl.to(darkWash, { opacity: 1, duration: 0.4, ease: 'power2.inOut' }, 0.2)

    setTimeout(resolve, 700)
  })
}

export async function menuToLightPage(overlayEl: HTMLDivElement, params: TransitionParams, cardClone: HTMLElement): Promise<void> {
  if (prefersReducedMotion()) return crossFade(overlayEl, 200)

  return new Promise((resolve) => {
    gsap.set(overlayEl, { visibility: 'visible', backgroundColor: 'transparent', opacity: 1 })
    
    const tl = gsap.timeline()
    const rect = params.sourceRect || { top: window.innerHeight / 2 - 200, left: window.innerWidth / 2 - 150, width: 300, height: 400 }
    
    gsap.set(cardClone, {
      position: 'absolute',
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      borderRadius: '24px',
      margin: 0,
      zIndex: 10,
      transformOrigin: 'center center'
    })

    cardClone.style.backdropFilter = 'none'
    cardClone.style.setProperty('-webkit-backdrop-filter', 'none')
    cardClone.style.background = 'transparent'
    cardClone.style.border = 'none'
    cardClone.style.boxShadow = 'none'

    window.dispatchEvent(new CustomEvent('menu:transition-accelerate'))

    const accent = params.accentColor || '#FFFFFF'

    tl.to(cardClone, {
      scale: 1.1,
      opacity: 0,
      duration: 0.4,
      ease: 'power2.in'
    }, 0)

    const energyBox = document.createElement('div')
    energyBox.style.position = 'absolute'
    energyBox.style.top = `${rect.top}px`
    energyBox.style.left = `${rect.left}px`
    energyBox.style.width = `${rect.width}px`
    energyBox.style.height = `${rect.height}px`
    energyBox.style.borderRadius = '24px'
    energyBox.style.background = accent
    energyBox.style.boxShadow = `0 0 120px 40px ${accent}`
    energyBox.style.opacity = '0'
    energyBox.style.zIndex = '11'
    overlayEl.appendChild(energyBox)

    tl.to(energyBox, {
      opacity: 1,
      scale: 1.2,
      duration: 0.3,
      ease: 'power2.out'
    }, 0)
    tl.to(energyBox, {
      opacity: 0,
      scale: 1.4,
      duration: 0.3,
      ease: 'power2.in'
    }, 0.3)

    const wash = document.createElement('div')
    wash.style.position = 'absolute'
    wash.style.inset = '0'
    wash.style.background = '#FFFFFF'
    wash.style.opacity = '0'
    wash.style.zIndex = '5'
    overlayEl.appendChild(wash)

    tl.to(wash, { opacity: 1, duration: 0.4, ease: 'power3.in' }, 0.2)

    setTimeout(() => {
      resolve()
    }, 600)
  })
}

export async function voiceToMenu(overlayEl: HTMLDivElement, params: TransitionParams): Promise<void> {
  if (prefersReducedMotion()) return crossFade(overlayEl, 200)

  return new Promise((resolve) => {
    gsap.set(overlayEl, { visibility: 'visible', backgroundColor: 'transparent', opacity: 1 })
    
    const burstOrigin = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    
    // The orb collapses into a single dense singularity point, then bursts back into the menu
    const point = document.createElement('div')
    point.style.position = 'absolute'
    point.style.width = '12px'
    point.style.height = '12px'
    point.style.borderRadius = '50%'
    point.style.backgroundColor = '#7C9BD9'
    point.style.boxShadow = '0 0 40px 10px #7C9BD9'
    gsap.set(point, { x: burstOrigin.x - 6, y: burstOrigin.y - 6, opacity: 0, scale: 0 })
    overlayEl.appendChild(point)

    const tl = gsap.timeline()
    
    // Appear and suck in
    tl.to(point, { opacity: 1, scale: 1.5, duration: 0.3, ease: 'back.out(1.7)' }, 0)
    tl.to(point, { scale: 0, duration: 0.2, ease: 'power3.in' }, 0.3)
    
    // Burst into warp speed
    const particleCount = 60
    const particles: HTMLDivElement[] = []
    
    tl.call(() => {
      for (let i = 0; i < particleCount; i++) {
        const p = document.createElement('div')
        p.style.position = 'absolute'
        p.style.width = '3px'
        p.style.height = '10px' // Streaks
        p.style.borderRadius = '2px'
        p.style.backgroundColor = '#7C9BD9'
        p.style.boxShadow = '0 0 8px #7C9BD9'
        p.style.top = '0'
        p.style.left = '0'
        p.style.transformOrigin = 'center top'
        gsap.set(p, { x: burstOrigin.x, y: burstOrigin.y, scaleY: 0, opacity: 1 })
        overlayEl.appendChild(p)
        particles.push(p)
      }

      const diagonal = Math.sqrt(window.innerWidth ** 2 + window.innerHeight ** 2)
      
      particles.forEach((p) => {
        const angle = Math.random() * Math.PI * 2
        const distance = diagonal * (0.6 + Math.random() * 0.6)
        const dx = Math.cos(angle) * distance
        const dy = Math.sin(angle) * distance
        const rotationDeg = (angle * 180) / Math.PI - 90

        gsap.set(p, { rotation: rotationDeg })
        gsap.to(p, {
          x: burstOrigin.x + dx,
          y: burstOrigin.y + dy,
          scaleY: 8 + Math.random() * 10,
          opacity: 0,
          duration: 0.4 + Math.random() * 0.2,
          ease: 'power2.out',
          onComplete: () => p.remove()
        })
      })
    }, [], 0.5)

    // Fill screen with menu dark so it blends seamlessly
    const darkWash = document.createElement('div')
    darkWash.style.position = 'absolute'
    darkWash.style.inset = '0'
    darkWash.style.background = '#0F0813'
    darkWash.style.opacity = '0'
    overlayEl.appendChild(darkWash)

    tl.to(darkWash, { opacity: 1, duration: 0.2 }, 0.5)

    setTimeout(resolve, 600)
  })
}

export async function lightpageToMenu(overlayEl: HTMLDivElement, params: TransitionParams): Promise<void> {
  if (prefersReducedMotion()) return crossFade(overlayEl, 200)

  return new Promise((resolve) => {
    gsap.set(overlayEl, { visibility: 'visible', backgroundColor: 'transparent', opacity: 1 })
    
    // Recreate the bright flashbang dissolving into cosmic dark
    const wash = document.createElement('div')
    wash.style.position = 'absolute'
    wash.style.inset = '0'
    wash.style.background = '#FFFFFF'
    wash.style.opacity = '1'
    overlayEl.appendChild(wash)

    const tl = gsap.timeline({
      onComplete: () => wash.remove()
    })

    // Quickly fade from pure white to the dark cosmic base
    tl.to(wash, { opacity: 0, duration: 0.5, ease: 'power2.out' }, 0.1)

    // Optionally add a subtle scale-down to the entire container if we wanted, 
    // but just fading the wash works perfectly to reveal the menu underneath

    setTimeout(resolve, 400)
  })
}

export async function anyToPin(overlayEl: HTMLDivElement, params: TransitionParams): Promise<void> {
  if (prefersReducedMotion()) return crossFade(overlayEl, 200)

  return new Promise((resolve) => {
    // T=0-250ms: Pull-back of current page (handled externally or by a global wrapper if possible?
    // Actually, we can just overlay a dark flash for 250ms while the push happens if we can't easily tween the whole app.
    // The spec says "current page (whatever it is) gets a GSAP to({scale: 0.92, opacity: 0...})".
    // We can do this by grabbing the main container if we know it.
    const portal = document.querySelector('[data-portal="kiosk"]')
    if (portal && portal.firstElementChild) {
      gsap.to(portal.firstElementChild, { scale: 0.92, opacity: 0, filter: 'blur(8px)', duration: 0.25 })
    }

    // Resolve exactly at 250ms so router pushes
    setTimeout(resolve, 250)
  })
}
