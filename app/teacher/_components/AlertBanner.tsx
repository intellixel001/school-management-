'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Props {
  pendingReviews: number
  pendingFeedback: number
}

export function AlertBanner({ pendingReviews, pendingFeedback }: Props) {
  const [show, setShow] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => {
      setMounted(true)
      setShow(true)
    }, 16)
    return () => clearTimeout(t)
  }, [])

  if (!mounted) return null

  const total = pendingReviews + pendingFeedback
  if (total === 0) return null

  // Build a context-aware message
  const parts: string[] = []
  if (pendingReviews > 0) {
    parts.push(`${pendingReviews} mock review${pendingReviews === 1 ? '' : 's'}`)
  }
  if (pendingFeedback > 0) {
    parts.push(`${pendingFeedback} practice feedback${pendingFeedback === 1 ? '' : 's'}`)
  }
  const message = parts.join(' and ')

  return (
    <div
      style={{
        overflow: 'hidden',
        maxHeight: show ? '72px' : '0',
        opacity: show ? 1 : 0,
        transition: 'max-height var(--transition-slow), opacity var(--transition-slow)',
        marginBottom: show ? '24px' : '0',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '12px 16px',
          borderRadius: 'var(--radius-lg)',
          background: 'rgba(217,119,6,0.15)',
          border: '2px solid rgba(217,119,6,0.40)',
          boxShadow: '0 4px 12px rgba(217,119,6,0.1)',
          flexWrap: 'wrap',
        }}
      >
        {/* Left */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* AlertTriangle inline SVG */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-warning)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-primary)' }}>
            You have <strong style={{ fontWeight: 700 }}>{message}</strong> waiting.
          </span>
        </div>

        {/* Right — one or two CTAs */}
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          {pendingReviews > 0 && (
            <CtaLink href="/teacher/review" label="Mock Reviews →" />
          )}
          {pendingFeedback > 0 && (
            <CtaLink href="/teacher/practice-feedback" label="Practice Feedback →" />
          )}
        </div>
      </div>
    </div>
  )
}

function CtaLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      style={{
        flexShrink: 0,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontFamily: 'var(--font-body)',
        fontSize: 13,
        fontWeight: 500,
        color: 'var(--text-primary)',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-md)',
        padding: '5px 12px',
        textDecoration: 'none',
        transition: 'background var(--transition-fast), border-color var(--transition-fast)',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLAnchorElement).style.background = 'var(--bg-surface-3)'
        ;(e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--border-strong)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLAnchorElement).style.background = 'var(--bg-surface)'
        ;(e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--border-default)'
      }}
    >
      {label}
    </Link>
  )
}
