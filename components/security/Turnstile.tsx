'use client'

/**
 * @file components/security/Turnstile.tsx
 * @description Cloudflare Turnstile widget (explicit render).
 *
 * Guards the public student registration form against automated signups.
 * NOT used on the kiosk — the kiosk is a supervised physical device and a
 * challenge there would add friction to a flow we deliberately simplified.
 *
 * Contract:
 *   - Calls `onVerify(token)` when the visitor passes. That token must be sent
 *     to the backend, which verifies it server-side against Cloudflare's
 *     /siteverify endpoint. A token is single-use and expires (~300s).
 *   - Calls `onExpire()` / `onError()` so the parent can clear a stale token.
 *
 * Graceful degradation: if NEXT_PUBLIC_TURNSTILE_SITE_KEY is unset (e.g. a
 * local dev machine that hasn't been configured), the widget renders nothing
 * and reports `notConfigured` rather than blocking the form. Enforcement is the
 * backend's job — it rejects a missing/invalid token regardless of what the
 * client does, so skipping here cannot be used to bypass the check.
 */

import { useEffect, useRef, useState } from 'react'

const SCRIPT_ID = 'cf-turnstile-script'
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string
  reset: (widgetId?: string) => void
  remove: (widgetId?: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

/** Loads the Turnstile script once per page and resolves when `window.turnstile` exists. */
function loadTurnstileScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('SSR'))
    if (window.turnstile) return resolve()

    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('Turnstile script failed to load')))
      return
    }

    const script = document.createElement('script')
    script.id = SCRIPT_ID
    script.src = SCRIPT_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Turnstile script failed to load'))
    document.head.appendChild(script)
  })
}

export interface TurnstileProps {
  /** Fired with the verification token once the visitor passes. */
  onVerify: (token: string) => void
  /** Fired when the token expires — parent should clear its stored token. */
  onExpire?: () => void
  /** Fired when the challenge errors — parent should clear its stored token. */
  onError?: () => void
  /** 'light' | 'dark' | 'auto' — student portal is light-themed. */
  theme?: 'light' | 'dark' | 'auto'
}

export default function Turnstile({
  onVerify,
  onExpire,
  onError,
  theme = 'light',
}: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const [failed, setFailed] = useState(false)

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

  // Keep the latest callbacks in refs so the render effect doesn't re-run (and
  // re-mount the widget) every time the parent re-renders with new closures.
  const cbRef = useRef({ onVerify, onExpire, onError })
  useEffect(() => {
    cbRef.current = { onVerify, onExpire, onError }
  }, [onVerify, onExpire, onError])

  useEffect(() => {
    if (!siteKey) return // not configured — see file header
    let cancelled = false

    loadTurnstileScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme,
          callback: (token: string) => cbRef.current.onVerify(token),
          'expired-callback': () => cbRef.current.onExpire?.(),
          'error-callback': () => {
            setFailed(true)
            cbRef.current.onError?.()
          },
        })
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true)
          cbRef.current.onError?.()
        }
      })

    return () => {
      cancelled = true
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current)
        } catch {
          /* widget already gone */
        }
        widgetIdRef.current = null
      }
    }
  }, [siteKey, theme])

  if (!siteKey) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div ref={containerRef} />
      {failed && (
        <span
          style={{
            fontFamily: 'var(--font-body, sans-serif)',
            fontSize: 12,
            color: '#991B1B',
          }}
        >
          Verification could not load. Please refresh the page and try again.
        </span>
      )}
    </div>
  )
}

/** True when a site key is configured, so callers can require a token only when the widget can actually render. */
export const isTurnstileConfigured = (): boolean =>
  Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY)
