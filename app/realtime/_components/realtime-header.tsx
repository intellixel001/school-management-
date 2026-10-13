/**
 * @file app/realtime/_components/realtime-header.tsx
 * @description Compact header for the Realtime voice practice page.
 * Shows the app title, subtitle, live connection status badge, connection
 * quality indicator (RTT-based), and the shared ModeToggle.
 *
 * Phase 5 additions:
 * - Connection quality polling: calls getConnectionQuality() every 5s when connected.
 * - Safe-area inset padding for notched/dynamic-island phones.
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import type { ConnectionState } from '@/types/realtime'
import type { ConnectionQuality } from '@/hooks/realtime/use-realtime-connection'
import { ModeToggle, type ModeToggleProps } from '@/components/mode-toggle'

// ─── Types ────────────────────────────────────────────────────────────────────

interface RealtimeHeaderProps {
  connectionState: ConnectionState
  getConnectionQuality: () => Promise<ConnectionQuality>
  onBeforeNavigate?: ModeToggleProps['onBeforeNavigate']
}

// ─── Connection status badge ──────────────────────────────────────────────────

const STATE_CONFIG: Record<
  ConnectionState,
  { label: string; dotClass: string; textClass: string }
> = {
  disconnected: {
    label: 'Disconnected',
    dotClass: 'bg-brand-muted',
    textClass: 'text-brand-muted',
  },
  connecting: {
    label: 'Connecting…',
    dotClass: 'bg-amber-400 animate-pulse',
    textClass: 'text-amber-400',
  },
  connected: {
    label: 'Live',
    dotClass: 'bg-brand-green',
    textClass: 'text-brand-green',
  },
  error: {
    label: 'Error',
    dotClass: 'bg-red-400',
    textClass: 'text-red-400',
  },
}

function ConnectionBadge({ state }: { state: ConnectionState }) {
  const { label, dotClass, textClass } = STATE_CONFIG[state]
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`Connection status: ${label}`}
      className="flex items-center gap-1.5"
    >
      <span className={`w-2 h-2 rounded-full flex-shrink-0 transition-colors duration-300 ${dotClass}`} />
      <span className={`text-xs font-medium transition-colors duration-300 ${textClass}`}>
        {label}
      </span>
    </div>
  )
}

// ─── Quality indicator ────────────────────────────────────────────────────────

const QUALITY_CONFIG: Record<ConnectionQuality, { color: string; label: string }> = {
  good:    { color: 'text-brand-green',    label: 'Good connection' },
  fair:    { color: 'text-amber-400',     label: 'Fair connection' },
  poor:    { color: 'text-red-400',       label: 'Poor connection' },
  unknown: { color: 'text-brand-muted/40', label: 'Connection quality unknown' },
}

function QualityDot({ quality }: { quality: ConnectionQuality }) {
  const { color, label } = QUALITY_CONFIG[quality]
  return (
    <span
      aria-label={label}
      title={label}
      className={`text-[10px] leading-none transition-colors duration-500 ${color}`}
    >
      ●
    </span>
  )
}

// ─── Header component ─────────────────────────────────────────────────────────

const QUALITY_POLL_MS = 5_000

export function RealtimeHeader({
  connectionState,
  getConnectionQuality,
  onBeforeNavigate,
}: RealtimeHeaderProps) {
  const [quality, setQuality] = useState<ConnectionQuality>('unknown')

  const pollQuality = useCallback(async () => {
    const q = await getConnectionQuality()
    setQuality(q)
  }, [getConnectionQuality])

  // Poll RTT every 5 seconds while connected
  useEffect(() => {
    if (connectionState !== 'connected') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuality('unknown')
      return
    }
    pollQuality()
    const id = setInterval(pollQuality, QUALITY_POLL_MS)
    return () => clearInterval(id)
  }, [connectionState, pollQuality])

  return (
    <header
      className="flex items-center justify-between px-4 sm:px-6 border-b border-white/[0.06] flex-shrink-0"
      style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
    >
      {/* Padding-bottom to match design */}
      <div className="pb-4 flex flex-col gap-0.5">
        <h1
          className="text-sm font-bold tracking-tight text-brand-text leading-none"
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          English AI Tutor
        </h1>
        <p className="text-[11px] text-brand-muted leading-none">
          Realtime Voice Practice
        </p>
      </div>

      <div className="pb-4 flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <ConnectionBadge state={connectionState} />
          {connectionState === 'connected' && (
            <QualityDot quality={quality} />
          )}
        </div>
        <ModeToggle onBeforeNavigate={onBeforeNavigate} />
      </div>
    </header>
  )
}
