/**
 * @file app/realtime/_components/error-banner.tsx
 * @description Dismissible stacked error notification system for the Realtime page.
 *
 * Features:
 * - Slides in from below the header with a CSS transition (no JS animation libs).
 * - Auto-dismisses after 8 seconds unless the error is marked `persistent`.
 * - Stacks up to 3 simultaneous errors.
 * - Shows a "Retry" button on errors that support it.
 * - All animations respect prefers-reduced-motion.
 */

'use client'

import { useEffect, useCallback } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ErrorSeverity = 'warning' | 'critical'

export interface RealtimeErrorItem {
  id: string
  message: string
  /** If true, suppresses auto-dismiss. Use for post-retry-exhaustion errors. */
  persistent?: boolean
  onRetry?: () => void
}

interface ErrorBannerProps {
  errors: RealtimeErrorItem[]
  onDismiss: (id: string) => void
  /** Called when auto-dismiss fires — same as onDismiss but by timer. */
}

// ─── Auto-dismiss hook ────────────────────────────────────────────────────────

const AUTO_DISMISS_MS = 8_000

function useAutoDismiss(
  errors: RealtimeErrorItem[],
  onDismiss: (id: string) => void
) {
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    errors.forEach((err) => {
      if (err.persistent) return
      const t = setTimeout(() => onDismiss(err.id), AUTO_DISMISS_MS)
      timers.push(t)
    })
    return () => { timers.forEach(clearTimeout) }
  }, [errors, onDismiss])
}

// ─── Single banner item ───────────────────────────────────────────────────────

function ErrorItem({
  error,
  onDismiss,
}: {
  error: RealtimeErrorItem
  onDismiss: () => void
}) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className={[
        'flex items-start gap-3 px-4 py-3 rounded-xl border text-sm',
        'bg-red-950/60 border-red-700/50 text-red-200',
        // Slide-in animation — defined in globals.css
        'animate-[slide-down_200ms_ease-out]',
        // Reduced motion: no animation
        'motion-reduce:animate-none',
      ].join(' ')}
    >
      {/* Warning icon */}
      <svg
        aria-hidden="true"
        className="w-4 h-4 mt-0.5 shrink-0 text-red-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
        />
      </svg>

      <p className="flex-1 leading-snug">{error.message}</p>

      <div className="flex items-center gap-2 shrink-0">
        {error.onRetry && (
          <button
            type="button"
            onClick={error.onRetry}
            aria-label="Retry connection"
            className="text-xs font-semibold text-red-300 hover:text-white
              border border-red-600/50 hover:border-red-400/70
              px-2.5 py-1 rounded-lg transition-colors duration-150"
          >
            Retry
          </button>
        )}
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss error"
          className="text-red-400 hover:text-white transition-colors duration-150 p-0.5"
        >
          <svg aria-hidden="true" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}

// ─── Error banner container ───────────────────────────────────────────────────

const MAX_VISIBLE = 3

export function ErrorBanner({ errors, onDismiss }: ErrorBannerProps) {
  const handleDismiss = useCallback((id: string) => onDismiss(id), [onDismiss])
  useAutoDismiss(errors, handleDismiss)

  const visible = errors.slice(0, MAX_VISIBLE)
  if (visible.length === 0) return null

  return (
    <div
      aria-label="Error notifications"
      className="flex flex-col gap-1.5 px-4 pt-2"
    >
      {visible.map((err) => (
        <ErrorItem key={err.id} error={err} onDismiss={() => handleDismiss(err.id)} />
      ))}
    </div>
  )
}
