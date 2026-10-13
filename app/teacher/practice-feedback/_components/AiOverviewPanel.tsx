'use client'

import { useState, useCallback } from 'react'
import { Sparkles, RefreshCw } from 'lucide-react'
import { generatePracticeSessionOverview } from '@/lib/services'
import { getRelativeTime } from '@/lib/utils/time'
import { Spinner } from '@/components/ui'
import type { Session } from '@/types/platform'

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  session: Session
  onSessionUpdate: (s: Session) => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AiOverviewPanel({ session, onSessionUpdate }: Props) {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const hasOverview = !!session.aiOverview

  const handleGenerate = useCallback(async () => {
    setError(null)
    setLoading(true)
    try {
      const updated = await generatePracticeSessionOverview(session.id)
      onSessionUpdate(updated)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [session.id, onSessionUpdate])

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{
      // Exact same card chrome as SessionContextPanel
      background: '#FFFFFF',
      border: '1px solid rgba(15,23,42,0.08)',
      borderRadius: 14,
      padding: '22px 24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
    }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: hasOverview ? 14 : 12,
        paddingBottom: hasOverview ? 14 : 10,
        borderBottom: '1px solid rgba(15,23,42,0.06)',
      }}>
        {/* Icon + Label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={16} strokeWidth={2.2} style={{ color: '#6366F1' }} />
          <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>
            AI Overview
          </span>
        </div>

        {/* Regenerate button — only shown when overview exists */}
        {hasOverview && (
          <button
            id="regenerate-ai-overview"
            onClick={handleGenerate}
            disabled={loading}
            aria-label="Regenerate AI overview"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '5px 12px',
              fontSize: 12, fontWeight: 600,
              color: loading ? '#94A3B8' : '#6366F1',
              background: loading ? 'rgba(148,163,184,0.08)' : 'rgba(99,102,241,0.08)',
              border: `1px solid ${loading ? 'rgba(148,163,184,0.18)' : 'rgba(99,102,241,0.20)'}`,
              borderRadius: 8,
              cursor: loading ? 'default' : 'pointer',
              transition: 'all 160ms ease',
              outline: 'none',
            }}
            onMouseEnter={e => {
              if (!loading) {
                e.currentTarget.style.background = 'rgba(99,102,241,0.14)'
                e.currentTarget.style.borderColor = 'rgba(99,102,241,0.32)'
              }
            }}
            onMouseLeave={e => {
              if (!loading) {
                e.currentTarget.style.background = 'rgba(99,102,241,0.08)'
                e.currentTarget.style.borderColor = 'rgba(99,102,241,0.20)'
              }
            }}
          >
            {loading
              ? <Spinner size="sm" />
              : <RefreshCw size={12} strokeWidth={2.5} />
            }
            {loading ? 'Generating…' : 'Regenerate'}
          </button>
        )}
      </div>

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      {hasOverview ? (
        /* Overview present */
        <div>
          <p style={{
            margin: 0,
            fontSize: 14, fontWeight: 500,
            color: '#374151',
            lineHeight: 1.65,
          }}>
            {session.aiOverview}
          </p>
          {session.aiOverviewGeneratedAt && (
            <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 8 }}>
              Generated {getRelativeTime(session.aiOverviewGeneratedAt)}
            </div>
          )}
        </div>
      ) : (
        /* Empty state — initial generation failed OR never run */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ margin: 0, fontSize: 13, color: '#6B7280', lineHeight: 1.55 }}>
            No AI overview yet — generation may have failed at submit time, or this is a historical session.
          </p>
          <div>
            <button
              id="generate-ai-overview"
              onClick={handleGenerate}
              disabled={loading}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '9px 16px',
                fontSize: 13, fontWeight: 600,
                color: loading ? '#94A3B8' : '#FFFFFF',
                background: loading
                  ? '#E2E8F0'
                  : 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                border: 'none',
                borderRadius: 8,
                cursor: loading ? 'default' : 'pointer',
                opacity: loading ? 0.75 : 1,
                transition: 'opacity 150ms ease',
                boxShadow: loading ? 'none' : '0 4px 12px rgba(99,102,241,0.28)',
              }}
            >
              {loading ? <Spinner size="sm" /> : <Sparkles size={13} strokeWidth={2.2} />}
              {loading ? 'Generating…' : 'Generate overview'}
            </button>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div style={{
          marginTop: 10, fontSize: 12, color: '#EF4444', fontWeight: 500,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span>⚠</span>
          {error}
        </div>
      )}
    </div>
  )
}
