'use client'

import React, { createContext, useContext, useState, useRef, useEffect } from 'react'
import type { TransitionKind, TransitionParams } from '@/lib/transitions/types'

interface TransitionContextValue {
  inFlightTransition: TransitionKind | null
  playTransition: (kind: TransitionKind, params?: TransitionParams, sourceEl?: HTMLElement) => Promise<void>
  useTransitionEntry: () => TransitionKind | null
  signalMounted: () => void
  _registerOverlay: (playFn: (kind: TransitionKind, params: TransitionParams, sourceEl?: HTMLElement) => Promise<void>, forceClear: () => void) => void
}

const TransitionContext = createContext<TransitionContextValue | null>(null)

export function TransitionProvider({ children }: { children: React.ReactNode }) {
  const [inFlightTransition, setInFlightTransition] = useState<TransitionKind | null>(null)
  
  // Track the most recently played transition for the destination page
  const entryTransitionRef = useRef<TransitionKind | null>(null)
  
  // For the overlay to expose its execute & force-clear functions
  const playRef = useRef<((kind: TransitionKind, params: TransitionParams, sourceEl?: HTMLElement) => Promise<void>) | null>(null)
  const clearRef = useRef<(() => void) | null>(null)

  // Promise resolver to let playTransition wait for the destination to mount
  const mountResolverRef = useRef<(() => void) | null>(null)
  const fallbackTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const _registerOverlay = (playFn: any, forceClear: () => void) => {
    playRef.current = playFn
    clearRef.current = forceClear
  }

  const playTransition = async (kind: TransitionKind, params: TransitionParams = {}, sourceEl?: HTMLElement) => {
    if (inFlightTransition) return // block concurrent transitions
    setInFlightTransition(kind)
    entryTransitionRef.current = kind
    
    // Play the visual sequence
    if (playRef.current) {
      await playRef.current(kind, params, sourceEl)
    }

    // Fallback in case the destination page fails to signal ready.
    // Bumped from 2s to 6s so a slow first-render (student fetch, cold-start
    // backend) doesn't drop the overlay onto the destination page's own
    // loading spinner. Destination pages should still call signalMounted()
    // AFTER their data has loaded — this is only a safety net.
    fallbackTimeoutRef.current = setTimeout(() => {
      if (clearRef.current) {
        clearRef.current()
      }
      setInFlightTransition(null)
    }, 6000)

    return Promise.resolve()
  }

  const signalMounted = () => {
    // Destination page mounted. Clear the fallback timeout.
    if (fallbackTimeoutRef.current) {
      clearTimeout(fallbackTimeoutRef.current)
      fallbackTimeoutRef.current = null
    }
    
    // Reset entry transition after 1 tick so it only applies to this exact mount
    setTimeout(() => {
      entryTransitionRef.current = null
    }, 0)

    const doClear = () => {
      if (clearRef.current) {
        clearRef.current()
      }
      setInFlightTransition(null)
    }

    if (entryTransitionRef.current === 'menu-to-practice' || entryTransitionRef.current === 'menu-to-mock') {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          doClear()
        })
      })
    } else {
      doClear()
    }
  }

  // Handle popstate for browser-back safety (Risk #8)
  useEffect(() => {
    const handlePopState = () => {
      // If a route change happened outside our system
      if (!inFlightTransition && clearRef.current) {
        clearRef.current()
        setInFlightTransition(null)
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [inFlightTransition])

  const useTransitionEntry = () => {
    return entryTransitionRef.current
  }

  return (
    <TransitionContext.Provider value={{ inFlightTransition, playTransition, useTransitionEntry, signalMounted, _registerOverlay }}>
      {children}
    </TransitionContext.Provider>
  )
}

export function useTransition() {
  const ctx = useContext(TransitionContext)
  if (!ctx) throw new Error('useTransition must be used within TransitionProvider')
  return ctx
}
