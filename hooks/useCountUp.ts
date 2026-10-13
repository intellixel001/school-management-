'use client'

import { useState, useEffect, useRef } from 'react'

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function useCountUp(target: number, duration: number = 600): number {
  const [value, setValue] = useState(prefersReducedMotion() ? target : 0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    // Skip animation entirely under reduced-motion — just snap to target
    if (prefersReducedMotion()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setValue(target)
      return
    }

    let startTimestamp: number | null = null
    const startValue = 0

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp
      const progress = Math.min((timestamp - startTimestamp) / duration, 1)
      const current = startValue + (target - startValue) * easeOutCubic(progress)

      setValue(Math.round(current))

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step)
      }
    }

    rafRef.current = requestAnimationFrame(step)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [target, duration])

  return value
}

