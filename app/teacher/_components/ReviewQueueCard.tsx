'use client'

import Link from 'next/link'
import { CheckCircle, ArrowRight, ClipboardCheck } from 'lucide-react'

interface ReviewQueueCardProps {
  pendingReviews: number
}

export function ReviewQueueCard({ pendingReviews }: ReviewQueueCardProps) {
  const hasPending = pendingReviews > 0

  return (
    <div style={{
      borderRadius: 14, overflow: 'hidden',
      border: '1px solid var(--border-default)',
    }}>
      {/* Dark header */}
      <div style={{
        background: 'linear-gradient(135deg, #0A1628 0%, #0E2444 100%)',
        padding: '14px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: 'rgba(77,159,255,0.18)',
            border: '1px solid rgba(77,159,255,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ClipboardCheck size={14} style={{ color: '#4D9FFF' }} />
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#F1F5F9' }}>
            Mock Reviews
          </span>
        </div>

        {hasPending ? (
          <div style={{
            fontSize: 11, fontWeight: 800, color: '#fff',
            background: '#EF4444', borderRadius: 20,
            padding: '2px 10px', letterSpacing: '0.2px',
          }}>
            {pendingReviews} pending
          </div>
        ) : (
          <div style={{
            fontSize: 11, fontWeight: 700, color: '#10B981',
            background: 'rgba(16,185,129,0.18)',
            border: '1px solid rgba(16,185,129,0.30)',
            borderRadius: 20, padding: '2px 10px',
          }}>
            All clear
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ background: 'var(--bg-surface)' }}>
        {hasPending ? (
          <div style={{ padding: '16px 16px 18px' }}>
            <p style={{
              fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5,
              margin: '0 0 14px',
            }}>
              {pendingReviews} mock section attempt{pendingReviews !== 1 ? 's' : ''} waiting for your review and score.
            </p>
            <Link
              href="/teacher/review"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                width: '100%', padding: '10px',
                background: 'linear-gradient(135deg, #4D9FFF 0%, #0066CC 100%)',
                color: '#fff', fontSize: 13, fontWeight: 700,
                borderRadius: 10, textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(0,102,204,0.30)',
                transition: 'opacity 150ms ease',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = '0.88' }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = '1' }}
            >
              Open Mock Reviews
              <ArrowRight size={14} strokeWidth={2.5} />
            </Link>
          </div>
        ) : (
          <div style={{
            padding: '28px 20px',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 8, textAlign: 'center',
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'rgba(16,185,129,0.10)',
              border: '1px solid rgba(16,185,129,0.22)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 4,
            }}>
              <CheckCircle size={24} style={{ color: '#10B981' }} />
            </div>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              All caught up
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
              No mock sections waiting for review.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
