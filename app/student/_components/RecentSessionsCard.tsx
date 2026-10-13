'use client'

import Link from 'next/link'
import { getRelativeTime } from '@/lib/utils/time'
import type { Session } from '@/types/platform'
import { SKILL_CFG, SkillKey } from './sharedConfig'

interface Props {
  sessions: Session[]
}

export function RecentSessionsCard({ sessions }: Props) {
  const completed = sessions
    .filter(s => s.status === 'completed')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3)

  return (
    <div className="recent-sessions-card-hover" style={{
      background: '#FFFFFF',
      borderRadius: 16,
      padding: '22px 24px',
      boxShadow: '0 1px 3px rgba(15,23,42,0.04), 0 0 0 1px rgba(99,102,241,0.10)',
      transition: 'box-shadow 200ms ease, transform 200ms ease',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 18,
      }}>
        <h2 style={{
          margin: 0, fontSize: 17, fontWeight: 700, color: '#0F172A',
          fontFamily: 'var(--font-display)',
        }}>
          Recent Sessions
        </h2>
        <Link href="/student/results" style={{
          fontSize: 13, color: '#6366F1', textDecoration: 'none', fontWeight: 600,
        }}>
          View all →
        </Link>
      </div>

      {completed.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '28px 0',
          color: '#64748B', fontSize: 14,
        }}>
          No sessions yet. Start your first practice to see your activity here.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {completed.map((sess, idx) => {
            const cfg = SKILL_CFG[sess.skillArea as SkillKey]
            const { Icon } = cfg
            const isLast = idx === completed.length - 1
            const scoreColor = sess.score >= 75 ? '#10B981' : sess.score >= 50 ? '#F59E0B' : '#F43F5E'
            const scoreBg = sess.score >= 75
              ? 'rgba(16,185,129,0.10)'
              : sess.score >= 50
                ? 'rgba(245,158,11,0.10)'
                : 'rgba(244,63,94,0.10)'

            return (
              <div key={sess.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 0',
                borderBottom: isLast ? 'none' : '1px solid #F1F5F9',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 11, flexShrink: 0,
                    background: `${cfg.color}1A`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={17} color={cfg.color} strokeWidth={2.2} />
                  </div>
                  <div>
                    <div style={{
                      fontSize: 14, fontWeight: 600, color: '#0F172A', textTransform: 'capitalize',
                    }}>
                      {sess.skillArea}
                    </div>
                    <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>
                      {getRelativeTime(sess.date)} · {Math.round(sess.duration / 60)} min
                    </div>
                  </div>
                </div>
                <div style={{
                  padding: '6px 14px', borderRadius: 10,
                  background: scoreBg, color: scoreColor,
                  fontSize: 14, fontWeight: 800, fontFamily: 'var(--font-mono)',
                }}>
                  {sess.score}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
