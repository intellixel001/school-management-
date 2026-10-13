/**
 * @file components/mode-toggle.tsx
 * @description Pill-shaped mode toggle that switches between the Manual (Groq PTT)
 * and Realtime (OpenAI WebRTC) modes via Next.js client-side navigation.
 *
 * Active segment is derived from `usePathname()` so it correctly reflects the
 * current route on direct navigation, refresh, and browser back/forward — never
 * from local state that could drift out of sync.
 *
 * The sliding indicator is a CSS-only transition (no JS animation libraries).
 * The toggle is keyboard-accessible: Tab to focus, Enter/Space to activate.
 *
 * When `onBeforeNavigate` is provided, the caller can run async side-effects
 * (e.g. disconnect WebRTC, show a confirm dialog) before the router.push fires.
 * If `onBeforeNavigate` returns `false`, navigation is cancelled.
 * 
 */

'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useCallback } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ModeToggleProps {
  /**
   * Optional async guard called before navigating away.
   * Return `false` to cancel navigation (e.g. after user declines a confirm dialog).
   * Return `true` (or void) to allow navigation to proceed.
   */
  onBeforeNavigate?: (targetPath: '/' | '/realtime') => boolean | Promise<boolean>
}

// ─── Segment config ───────────────────────────────────────────────────────────

const SEGMENTS = [
  { label: 'Manual', path: '/' as const },
  { label: 'Realtime', path: '/realtime' as const, live: true },
] as const

type SegmentPath = (typeof SEGMENTS)[number]['path']

// ─── Component ────────────────────────────────────────────────────────────────

export function ModeToggle({ onBeforeNavigate }: ModeToggleProps) {
  const pathname = usePathname()
  const router   = useRouter()

  // Match active segment: /realtime/* → Realtime, everything else → Manual
  const activePath: SegmentPath = pathname.startsWith('/realtime') ? '/realtime' : '/'

  const handleSelect = useCallback(
    async (targetPath: SegmentPath) => {
      if (targetPath === activePath) return // already here

      // Run the caller's guard (e.g. confirm dialog + disconnect) if provided
      if (onBeforeNavigate) {
        const allowed = await onBeforeNavigate(targetPath)
        if (allowed === false) return
      }

      router.push(targetPath)
    },
    [activePath, onBeforeNavigate, router]
  )

  return (
    <div
      role="tablist"
      aria-label="Switch between Manual and Realtime voice modes"
      className="relative flex items-center bg-white/[0.07] border border-white/[0.1] rounded-full p-0.5 gap-0"
    >
      {/* Sliding active indicator */}
      <div
        aria-hidden="true"
        className={[
          'absolute top-0.5 bottom-0.5 rounded-full bg-brand-primary/80',
          'transition-all duration-300 ease-in-out',
          // Manual is narrower (45%), Realtime label is longer so uses 52%
          activePath === '/realtime' ? 'w-[52%] left-[calc(48%-2px)]' : 'w-[45%] left-0.5',
        ].join(' ')}
      />

      {SEGMENTS.map((segment) => {
        const { label, path } = segment
        const live = 'live' in segment ? segment.live : false
        const isActive = activePath === path
        return (
          <button
            key={path}
            role="tab"
            aria-selected={isActive}
            aria-label={`Switch to ${label} mode`}
            onClick={() => { void handleSelect(path) }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                void handleSelect(path)
              }
            }}
            className={[
              // Layout + shape
              'relative cursor-pointer z-10 flex items-center gap-1.5 px-5 py-2 rounded-full',
              'text-[12px] font-semibold tracking-wide',
              'transition-colors duration-300 focus-visible:outline-none',
              'focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-1 focus-visible:ring-offset-transparent',
              // Color: active is bright, inactive is muted
              isActive ? 'text-white' : 'text-brand-muted hover:text-brand-text',
            ].join(' ')}
          >
            {label}
            {/* Live dot on the Realtime segment */}
            {live && (
              <span
                aria-label="Live"
                className={[
                  'w-1.5 h-1.5 rounded-full transition-colors duration-300',
                  isActive ? 'bg-brand-green' : 'bg-brand-muted/70',
                ].join(' ')}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}
