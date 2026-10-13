'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { gsap, useGSAP, prefersReducedMotion } from '@/lib/gsap'
import { PoeticParticles } from './PoeticParticles'
import { InkBlooms } from './InkBlooms'
import { LibraryProp } from './LibraryProp'
import { libraryProps } from './props.config'
import styles from './LibraryScene.module.css'

export interface LibrarySceneProps {
  /** Render the floating hero props (bust, candle, book, quill). Default: true. */
  showProps?: boolean
  /** Render the poetic particle system. Default: true. */
  showParticles?: boolean
  /** CSS selectors the poetic word-formation should avoid. Default: ['.library-prop']. */
  avoidSelectors?: string[]
}

export function LibraryScene({ showProps = true, showParticles = true, avoidSelectors = ['.library-prop'] }: LibrarySceneProps = {}) {
  const containerRef = useRef<HTMLDivElement>(null)
  
  useGSAP(() => {
    if (!containerRef.current) return

    const getDepthOpacity = (id: string) => {
      const prop = libraryProps.find(p => p.id === id)
      if (!prop) return 1
      return { near: 1.0, mid: 0.9, far: 0.55 }[prop.depth]
    }

    if (prefersReducedMotion()) {
      // Set everything to final state instantly
      gsap.set(`.${styles.sceneContainer}`, { opacity: 1 })
      gsap.set('.bookshelf-bg', { opacity: 0.55 })
      gsap.set(`.${styles.windowGlow}`, { opacity: 1 })
      gsap.set(`.${styles.volumetricLightContainer}`, { opacity: 0.45 })
      gsap.set('#ink-blooms-container', { opacity: 1 })
      if (showParticles) gsap.set('#poetic-particles-canvas', { opacity: 1 })
      
      if (showProps) {
        libraryProps.forEach(prop => {
          gsap.set(`.library-prop-${prop.id}`, { opacity: getDepthOpacity(prop.id), x: 0, y: 0, rotation: 0 })
        })
      }
      
      // Keep pure CSS/simple background loops going
      gsap.to('.warm-bloom-breath', {
        scale: 1.03,
        opacity: 1,
        duration: 4,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut'
      })
      gsap.set('.warm-bloom-breath', { opacity: 0.9, scale: 1.0 })
      return
    }

    const tl = gsap.timeline()
    
    // t=0.0s Background gradient fades in
    tl.fromTo(containerRef.current, { opacity: 0 }, { opacity: 1, duration: 0.9, ease: 'power2.out' }, 0)
    
    // t=0.15s Bookshelf photo fades in
    tl.fromTo('.bookshelf-bg', { opacity: 0 }, { opacity: 0.55, duration: 1.4, ease: 'power2.out' }, 0.15)
    
    // t=0.3s Window glow fades in
    tl.fromTo(`.${styles.windowGlow}`, { opacity: 0 }, { opacity: 1, duration: 1.2, ease: 'power2.out' }, 0.3)
    
    // t=0.5s God-rays fade in
    tl.fromTo(`.${styles.volumetricLightContainer}`, { opacity: 0 }, { opacity: 0.45, duration: 1.4, ease: 'power2.out' }, 0.5)

    // t=0.6s Ink blooms fade in
    tl.fromTo('#ink-blooms-container', { opacity: 0 }, { opacity: 1, duration: 1.2, ease: 'power2.inOut' }, 0.6)
    
    if (showParticles) {
      tl.fromTo('#poetic-particles-canvas', { opacity: 0 }, { opacity: 1, duration: 1.0, ease: 'power2.inOut' }, 0.7)
    }
    
    if (showProps) {
      // t=0.5s UPPER PROPS enter
      tl.fromTo('.library-prop-shakespeare-bust', { y: 40, opacity: 0, rotation: -8 }, { y: 0, opacity: getDepthOpacity('shakespeare-bust'), rotation: 0, duration: 0.9, ease: 'power3.out' }, 0.5)
      tl.fromTo('.library-prop-brass-candle', { y: -20, opacity: 0 }, { y: 0, opacity: getDepthOpacity('brass-candle'), duration: 0.6, ease: 'power2.out' }, 0.7)

      // t=1.4s LOWER PROPS enter
      tl.fromTo('.library-prop-open-book', { y: 50, opacity: 0, rotation: 12 }, { y: 0, opacity: getDepthOpacity('open-book'), rotation: 0, duration: 0.8, ease: 'power3.out' }, 1.4)
      tl.fromTo('.library-prop-ink-quill', { y: 30, opacity: 0, rotation: -12 }, { y: 0, opacity: getDepthOpacity('ink-quill'), rotation: 0, duration: 0.8, ease: 'power3.out' }, 1.6)
    }

    // Ambient background loops
    gsap.to('.warm-bloom-breath', {
      scale: 1.03,
      opacity: 1,
      duration: 4,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut'
    })
    gsap.set('.warm-bloom-breath', { opacity: 0.9, scale: 1.0 })

    gsap.to(`.${styles.windowGlow}`, {
      scale: 1.02,
      opacity: 0.9, // opacity 0.9 <-> 1.0
      duration: 6, // 12s cycle
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut'
    })

    gsap.to(`.${styles.volumetricLightContainer}`, {
      x: 12,
      duration: 10, // 20s cycle
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut'
    })

  }, { scope: containerRef })

  return (
    <div ref={containerRef} className={styles.sceneContainer} style={{ opacity: 0 }}>
      
      {/* z:1 Blurred antique library-room photo */}
      <Image 
        src="https://res.cloudinary.com/dvvcwzp4n/image/upload/v1784071005/library-background_qv8d0b.webp" 
        alt="" 
        fill 
        priority 
        sizes="100vw"
        className={`bookshelf-bg ${styles.bookshelfImage}`} 
      />

      {/* z:2 Warm window glow */}
      <div className={styles.windowGlow} />

      {/* z:3 Volumetric light rays */}
      <div className={styles.volumetricLightContainer}>
        <div className={`${styles.godRay} ${styles.ray1}`} />
        <div className={`${styles.godRay} ${styles.ray2}`} />
        <div className={`${styles.godRay} ${styles.ray3}`} />
      </div>

      {/* z:4 Bottom vignette / darker floor gradient */}
      <div className={styles.floorVignette} />

      {/* z:5 Warm bloom */}
      <div className={`${styles.warmBloom} warm-bloom-breath`} style={{ zIndex: 5 }} />
      
      {/* z:6 Ink-wisp corner watercolour blooms */}
      <InkBlooms />

      {/* z:7 Poetic particle system */}
      {showParticles && <PoeticParticles avoidSelectors={avoidSelectors} />}
      
      {/* z:8 Props */}
      {showProps && (
        <div className={styles.propsContainer} style={{ zIndex: 8 }}>
          {libraryProps.filter(p => p.enabled).map(prop => (
            <LibraryProp key={prop.id} config={prop} />
          ))}
        </div>
      )}

      {/* z:10 Film grain */}
      <svg className={styles.filmGrain} style={{ zIndex: 10 }}>
        <filter id="noiseFilter">
          <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="3" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#noiseFilter)" />
      </svg>
    </div>
  )
}
