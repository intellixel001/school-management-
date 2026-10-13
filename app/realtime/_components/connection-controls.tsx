/**
 * @file app/realtime/_components/connection-controls.tsx
 * @description Connect / Disconnect controls below the voice orb.
 *
 * Phase 5 additions:
 * - Slow-connect reassurance text after 3s in "connecting" state.
 * - onRetry prop for the "error" state so the error banner Retry button works.
 * - Touch target area ≥ 48px ensured via padding.
 * - Improved error label (no longer says "check console").
 */

'use client'

import { useState, useEffect } from 'react'
import type { MicPermissionState } from '@/hooks/realtime/use-microphone'
import type { OrbPageState } from './voice-orb'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ConnectionControlsProps {
  pageState: OrbPageState
  permissionState: MicPermissionState
  reconnectAttempt: number
  onConnect: () => void
  onDisconnect: () => void
  onRetry?: () => void
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg aria-hidden="true" className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

const SLOW_CONNECT_THRESHOLD_MS = 3_000

export function ConnectionControls({
  pageState,
  permissionState,
  reconnectAttempt,
  onConnect,
  onDisconnect,
  onRetry,
}: ConnectionControlsProps) {
  const isMicBlocked = permissionState === 'denied' || permissionState === 'error'
  const isConnecting = pageState === 'connecting'
  const isConnected  = pageState === 'connected'

  // Show reassurance text if connecting takes more than 3 seconds
  const [showSlowText, setShowSlowText] = useState(false)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!isConnecting) { setShowSlowText(false); return }
    const t = setTimeout(() => setShowSlowText(true), SLOW_CONNECT_THRESHOLD_MS)
    return () => clearTimeout(t)
  }, [isConnecting])

  if (isMicBlocked) {
    return (
      <div role="alert" className="flex flex-col items-center gap-2 text-center max-w-xs px-4">
        <p className="text-sm text-red-400 font-medium">Microphone access required</p>
        <p className="text-xs text-brand-muted leading-relaxed">
          Allow microphone access in your browser settings, then refresh the page.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-xs px-4">
      {isConnected ? (
        <button
          id="realtime-disconnect-btn"
          type="button"
          aria-label="End the voice conversation"
          onClick={onDisconnect}
          className="w-full py-3 px-6 rounded-2xl text-sm font-semibold min-h-[48px]
            bg-white/[0.08] hover:bg-white/[0.13] active:bg-white/[0.06]
            border border-white/10 hover:border-white/20
            text-brand-muted hover:text-brand-text
            transition-all duration-200"
        >
          End Conversation
        </button>
      ) : (
        <button
          id="realtime-connect-btn"
          type="button"
          disabled={isConnecting}
          aria-label={isConnecting ? 'Connecting to voice service' : 'Start a voice conversation'}
          onClick={onConnect}
          className="w-full py-3 px-6 rounded-2xl text-sm font-semibold min-h-[48px]
            bg-brand-primary hover:bg-[#6d28d9] active:bg-[#5b21b6]
            disabled:opacity-60 disabled:cursor-not-allowed
            text-white shadow-[0_0_24px_rgba(124,58,237,0.4)]
            hover:shadow-[0_0_32px_rgba(124,58,237,0.6)]
            transition-all duration-200 flex items-center justify-center gap-2"
        >
          {isConnecting && <Spinner />}
          {isConnecting ? 'Connecting…' : 'Start Conversation'}
        </button>
      )}

      {/* Slow-connect reassurance */}
      {isConnecting && showSlowText && (
        <p className="text-[11px] text-brand-muted/80 text-center animate-pulse">
          {reconnectAttempt > 0
            ? `Reconnecting… attempt ${reconnectAttempt} of 3`
            : 'Setting up secure connection…'}
        </p>
      )}

      {/* Error state — show Retry if available */}
      {pageState === 'error' && !isMicBlocked && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs text-red-400/80 text-center">
            Connection failed after multiple attempts.
          </p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="text-xs font-semibold text-brand-accent hover:text-white
                border border-brand-accent/40 hover:border-brand-accent/80
                px-4 py-2 rounded-xl transition-all duration-200 min-h-[44px]"
            >
              Try Again
            </button>
          )}
        </div>
      )}
    </div>
  )
}
