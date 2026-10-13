'use client'

import React, { useEffect, useRef } from 'react'
import { useTransition } from './TransitionProvider'
import { gsap } from '@/lib/gsap'
import type { TransitionKind, TransitionParams } from '@/lib/transitions/types'
import {
  pinToMenu,
  menuToVoice,
  menuToLightPage,
  voiceToMenu,
  lightpageToMenu,
  anyToPin
} from '@/lib/transitions/sequences'

export default function TransitionOverlay() {
  const { _registerOverlay } = useTransition()
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const play = async (kind: TransitionKind, params: TransitionParams, sourceEl?: HTMLElement) => {
      if (!overlayRef.current) return
      
      const el = overlayRef.current
      gsap.killTweensOf(el) // Kill any existing tweens just in case
      // Reset basic styles
      gsap.set(el, { visibility: 'visible', opacity: 1, backgroundColor: 'transparent' })

      try {
        switch (kind) {
          case 'pin-to-menu':
            await pinToMenu(el, params)
            break
          case 'menu-to-voice':
            if (sourceEl) {
              const clone = sourceEl.cloneNode(true) as HTMLElement
              el.appendChild(clone)
              await menuToVoice(el, params, clone)
            }
            break
          case 'menu-to-practice':
          case 'menu-to-mock':
            if (sourceEl) {
              const clone = sourceEl.cloneNode(true) as HTMLElement
              el.appendChild(clone)
              await menuToLightPage(el, params, clone)
            }
            break
          case 'voice-to-menu':
            await voiceToMenu(el, params)
            break
          case 'lightpage-to-menu':
            await lightpageToMenu(el, params)
            break
          case 'any-to-pin':
            await anyToPin(el, params)
            break
          case 'generic-fade':
          default:
            // Fallback: 400ms crossfade
            await new Promise<void>(resolve => {
              gsap.fromTo(el, 
                { opacity: 0, backgroundColor: '#120A08' },
                { opacity: 1, duration: 0.2, onComplete: () => {
                  resolve()
                  // don't hide yet, the route push happens now,
                  // we will hide later via forceClear or next transition
                }}
              )
            })
            break
        }
      } catch (err) {
        console.error('Transition sequence error', err)
      }
    }

    const forceClear = () => {
      if (!overlayRef.current) return
      const el = overlayRef.current
      gsap.killTweensOf(el)
      gsap.to(el, {
        opacity: 0,
        duration: 0.2,
        onComplete: () => {
          gsap.set(el, { visibility: 'hidden' })
          el.innerHTML = '' // Clear all clones/particles
        }
      })
    }

    _registerOverlay(play, forceClear)
  }, [_registerOverlay])

  return (
    <div
      ref={overlayRef}
      className="transition-overlay"
      data-theme="dark"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        pointerEvents: 'none',
        visibility: 'hidden',
      }}
    />
  )
}
