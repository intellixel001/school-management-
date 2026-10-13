/**
 * lib/gsap.ts — Central GSAP setup module
 *
 * All design-phase components MUST import gsap/useGSAP from this module —
 * never directly from 'gsap' or '@gsap/react'. This guarantees plugins are
 * registered once, reduced-motion config is applied uniformly, and we have
 * a single place to add cross-cutting behaviour.
 */

import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Flip } from 'gsap/Flip'
import { TextPlugin } from 'gsap/TextPlugin'

// ─── Plugin registration (client-only) ─────────────────────────────────────

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, Flip, TextPlugin, useGSAP)
}

// ─── Reduced-motion configuration ───────────────────────────────────────────

/**
 * `true` when the user has requested reduced motion via their OS / browser
 * settings. Components should check this to short-circuit complex
 * choreography and fall back to instant or near-instant transitions.
 */
export const PREFERS_REDUCED_MOTION: boolean =
  typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false

/**
 * Convenience function — returns the current reduced-motion preference.
 * Useful inside components that need conditional choreography.
 */
export function prefersReducedMotion(): boolean {
  return PREFERS_REDUCED_MOTION
}

// When reduced motion is active, tell GSAP to skip animations globally.
// We don't set duration to 0 (that can break some logic), but we let
// GSAP sleep aggressively and callers use the exported flag to decide.
if (PREFERS_REDUCED_MOTION) {
  gsap.config({ autoSleep: 60 })
}

// ─── Re-exports ─────────────────────────────────────────────────────────────

export { gsap, useGSAP }
