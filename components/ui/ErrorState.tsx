'use client'

import { useEffect } from 'react'

interface ErrorStateProps {
  /** The big heading. */
  title: string
  /** 1–2 sentence body explaining what happened. */
  body: string
  /** Primary action (e.g., "Try again" or "Tap to restart"). */
  primaryAction: {
    label: string
    onClick: () => void
  }
  /** Optional secondary action (e.g., "Go to dashboard" or "Log out"). */
  secondaryAction?: {
    label: string
    onClick: () => void
    /** 'default' for neutral, 'danger' for destructive actions (red). */
    variant?: 'default' | 'danger'
  }
  /** Theme — dark for kiosk, light for web portals. */
  theme?: 'dark' | 'light'
  /** Optional auto-recovery: calls primaryAction.onClick after N ms. */
  autoRecoverMs?: number
  /** Optional small reference code for debugging (e.g., error.digest). */
  errorCode?: string
}

export default function ErrorState({
  title,
  body,
  primaryAction,
  secondaryAction,
  theme = 'light',
  autoRecoverMs,
  errorCode,
}: ErrorStateProps) {
  useEffect(() => {
    if (!autoRecoverMs) return
    const t = setTimeout(primaryAction.onClick, autoRecoverMs)
    return () => clearTimeout(t)
  }, [autoRecoverMs, primaryAction])

  const palette = theme === 'dark'
    ? { bg: '#120A08', text: '#F1F5F9', subtext: '#94A3B8', primary: '#E8B96C', secondary: 'rgba(255,255,255,0.08)' }
    : { bg: '#FAFAFA', text: '#0F172A', subtext: '#64748B', primary: '#4F46E5', secondary: 'rgba(15,23,42,0.06)' }

  return (
    <div
      style={{
        minHeight: '100dvh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        background: palette.bg,
        color: palette.text,
        gap: 24,
      }}
    >
      <div
        aria-hidden
        style={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          background: theme === 'dark' ? 'rgba(232,185,108,0.12)' : 'rgba(79,70,229,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 32,
        }}
      >
        ⚠
      </div>

      <h1 style={{ fontSize: 28, fontWeight: 600, textAlign: 'center', margin: 0, maxWidth: 520, fontFamily: 'Geist, sans-serif' }}>
        {title}
      </h1>

      <p style={{ fontSize: 16, color: palette.subtext, textAlign: 'center', maxWidth: 480, lineHeight: 1.55, margin: 0, fontFamily: 'Geist, sans-serif' }}>
        {body}
      </p>

      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        <button
          onClick={primaryAction.onClick}
          style={{
            minHeight: 56,
            padding: '0 28px',
            borderRadius: 14,
            background: palette.primary,
            color: theme === 'dark' ? '#120A08' : '#FFFFFF',
            border: 'none',
            fontWeight: 600,
            fontSize: 15,
            cursor: 'pointer',
            fontFamily: 'Geist, sans-serif'
          }}
        >
          {primaryAction.label}
        </button>

        {secondaryAction && (
          <button
            onClick={secondaryAction.onClick}
            style={{
              minHeight: 56,
              padding: '0 24px',
              borderRadius: 14,
              background: secondaryAction.variant === 'danger'
                ? '#DC2626'
                : palette.secondary,
              color: secondaryAction.variant === 'danger'
                ? '#FFFFFF'
                : palette.text,
              border: 'none',
              fontWeight: secondaryAction.variant === 'danger' ? 600 : 500,
              fontSize: 15,
              cursor: 'pointer',
              fontFamily: 'Geist, sans-serif'
            }}
          >
            {secondaryAction.label}
          </button>
        )}
      </div>

      {errorCode && (
        <p style={{ fontFamily: 'monospace', fontSize: 11, color: palette.subtext, opacity: 0.6, marginTop: 24 }}>
          {errorCode}
        </p>
      )}
    </div>
  )
}
