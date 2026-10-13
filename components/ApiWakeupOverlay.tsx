'use client'

/**
 * @file components/ApiWakeupOverlay.tsx
 * @description Full-screen loading overlay shown while the Render backend
 * boots up from a cold start.
 *
 * Behaviour:
 *   - Mounted once at the app root (see app/layout.tsx).
 *   - On mount, pings GET /api/health. Render free-tier can take 30–60 s
 *     when the dyno is asleep, so we give it up to 90 s before showing an
 *     error state with a retry button.
 *   - When USE_REAL_API is off, renders nothing (dummy data is instant).
 *   - After a successful ping in the current tab, we set a session-storage
 *     flag so we don't re-show the overlay on client navigations.
 *
 * Presentation is intentionally lightweight: a centred spinner, a friendly
 * "Warming up the server..." message with a progressive hint at 15 s, and
 * a subtle progress bar so the wait feels bounded.
 */

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { pingHealth } from '@/lib/api/client'
import { USE_REAL_API } from '@/lib/api/env'

const WARMED_KEY = 'ec-api-warmed'
const TIMEOUT_MS = 90_000
const HINT_AT_MS = 15_000

type Status = 'idle' | 'warming' | 'slow' | 'ready' | 'failed'

export function ApiWakeupOverlay() {
  const pathname = usePathname()
  const isAdminPreview = pathname === '/admin' || pathname.startsWith('/admin/')
  const [status, setStatus] = useState<Status>('idle')

  useEffect(() => {
    if (isAdminPreview || !USE_REAL_API) {
      setStatus('ready')
      return
    }

    // Already warmed in this tab → skip.
    if (typeof window !== 'undefined' && sessionStorage.getItem(WARMED_KEY) === '1') {
      setStatus('ready')
      return
    }

    let cancelled = false
    setStatus('warming')

    const hintTimer = setTimeout(() => {
      if (!cancelled) setStatus(prev => (prev === 'warming' ? 'slow' : prev))
    }, HINT_AT_MS)

    pingHealth(TIMEOUT_MS).then(ok => {
      if (cancelled) return
      clearTimeout(hintTimer)
      if (ok) {
        try { sessionStorage.setItem(WARMED_KEY, '1') } catch { /* ignore */ }
        setStatus('ready')
      } else {
        setStatus('failed')
      }
    })

    return () => {
      cancelled = true
      clearTimeout(hintTimer)
    }
  }, [isAdminPreview])

  const handleRetry = () => {
    setStatus('warming')
    pingHealth(TIMEOUT_MS).then(ok => {
      if (ok) {
        try { sessionStorage.setItem(WARMED_KEY, '1') } catch { /* ignore */ }
        setStatus('ready')
      } else {
        setStatus('failed')
      }
    })
  }

  if (isAdminPreview || status === 'idle' || status === 'ready') return null

  const isFailed = status === 'failed'
  const showSlowHint = status === 'slow'

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position:       'fixed',
        inset:          0,
        zIndex:         9999,
        background:     'rgba(245, 245, 242, 0.98)',
        backdropFilter: 'blur(6px)',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        padding:        '24px',
      }}
    >
      <div
        style={{
          maxWidth:      '420px',
          width:         '100%',
          textAlign:     'center',
          display:       'flex',
          flexDirection: 'column',
          alignItems:    'center',
          gap:           '20px',
        }}
      >
        {!isFailed && (
          <div
            aria-hidden
            style={{
              width:        '52px',
              height:       '52px',
              borderRadius: '50%',
              border:       '3px solid rgba(0, 102, 204, 0.15)',
              borderTopColor: '#0066CC',
              animation:    'ec-wakeup-spin 900ms linear infinite',
            }}
          />
        )}

        {isFailed && (
          <div
            aria-hidden
            style={{
              width:        '52px',
              height:       '52px',
              borderRadius: '50%',
              background:   'rgba(220, 38, 38, 0.10)',
              display:      'flex',
              alignItems:   'center',
              justifyContent: 'center',
              fontSize:     '28px',
              color:        '#DC2626',
              fontWeight:   600,
            }}
          >
            !
          </div>
        )}

        <div>
          <h2
            style={{
              fontFamily: 'var(--font-space-grotesk), sans-serif',
              fontSize:   '20px',
              fontWeight: 600,
              color:      '#0D0D0D',
              margin:     0,
              marginBottom: '8px',
            }}
          >
            {isFailed
              ? 'Server is not responding'
              : showSlowHint
                ? 'Almost there…'
                : 'Warming up the server…'}
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-outfit), sans-serif',
              fontSize:   '14px',
              lineHeight: 1.5,
              color:      '#6B7280',
              margin:     0,
            }}
          >
            {isFailed
              ? 'We couldn\'t reach English AI Tutor. Please check your connection and try again.'
              : showSlowHint
                ? 'The server was asleep and is booting up. This can take up to a minute on the first visit.'
                : 'Connecting to English AI Tutor. This only takes a moment.'}
          </p>
        </div>

        {!isFailed && (
          <div
            style={{
              width:          '220px',
              height:         '3px',
              borderRadius:   '999px',
              background:     'rgba(0, 102, 204, 0.10)',
              overflow:       'hidden',
              position:       'relative',
            }}
          >
            <div
              style={{
                position:   'absolute',
                inset:      0,
                background: 'linear-gradient(90deg, transparent, #0066CC, transparent)',
                animation:  'ec-wakeup-shimmer 1.6s ease-in-out infinite',
              }}
            />
          </div>
        )}

        {isFailed && (
          <button
            type="button"
            onClick={handleRetry}
            style={{
              padding:      '10px 22px',
              borderRadius: '999px',
              border:       'none',
              background:   '#0066CC',
              color:        '#fff',
              fontFamily:   'var(--font-outfit), sans-serif',
              fontSize:     '14px',
              fontWeight:   500,
              cursor:       'pointer',
            }}
          >
            Try again
          </button>
        )}
      </div>

      <style>{`
        @keyframes ec-wakeup-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes ec-wakeup-shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  )
}
