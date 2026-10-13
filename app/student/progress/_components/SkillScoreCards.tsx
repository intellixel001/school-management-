'use client'

import { SKILL_CONFIG, SKILL_ORDER } from '@/lib/skillConfig'
import type { SkillArea, Session } from '@/types/platform'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

const SKILL_PAL: Record<SkillArea, { color: string; bar: string; bg: string; border: string }> = {
  reading:   { color:'#6366F1', bar:'linear-gradient(90deg,#6366F1,#818CF8)', bg:'rgba(99,102,241,0.09)',  border:'rgba(99,102,241,0.18)' },
  writing:   { color:'#10B981', bar:'linear-gradient(90deg,#10B981,#34D399)', bg:'rgba(16,185,129,0.09)',  border:'rgba(16,185,129,0.18)' },
  speaking:  { color:'#F59E0B', bar:'linear-gradient(90deg,#F59E0B,#FCD34D)', bg:'rgba(245,158,11,0.09)',  border:'rgba(245,158,11,0.18)' },
  listening: { color:'#EC4899', bar:'linear-gradient(90deg,#EC4899,#F472B6)', bg:'rgba(236,72,153,0.09)',  border:'rgba(236,72,153,0.18)' },
}

interface Props {
  skills:   Record<SkillArea, number>
  sessions: Session[]
}

export function SkillScoreCards({ skills, sessions }: Props) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4" style={{ gap: 14 }}>
      {SKILL_ORDER.map((skill, idx) => {
        const cfg  = SKILL_CONFIG[skill]
        const pal  = SKILL_PAL[skill]
        const Icon = cfg.icon
        const score = skills[skill]

        // Delta: current score vs most recent completed session for this skill
        const skillSessions = sessions
          .filter(s => s.skillArea === skill)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        const lastScore  = skillSessions[0]?.score ?? null
        const delta      = lastScore !== null ? score - lastScore : null
        const sessCount  = skillSessions.length

        const scoreColor = score >= 75 ? '#10B981' : score >= 50 ? '#F59E0B' : '#EF4444'

        return (
          <div
            key={skill}
            style={{
              background: '#FFFFFF', borderRadius: 16,
              border: `1px solid rgba(0,0,0,0.07)`,
              borderLeft: `4px solid ${pal.color}`,
              boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
              padding: '16px 16px 14px',
              display: 'flex', flexDirection: 'column', gap: 12,
              animation: `fadeSlideUp 280ms ease-out ${idx * 60}ms both`,
              transition: 'box-shadow 150ms ease, transform 150ms ease',
            }}
          >
            {/* Icon + label + session count */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{
                width: 38, height: 38, borderRadius: 11,
                background: pal.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={18} color={pal.color} strokeWidth={2.2} />
              </div>
              {sessCount > 0 && (
                <span style={{
                  fontSize: 10, fontWeight: 600, color: '#94A3B8',
                  background: '#F8FAFC', borderRadius: 6, padding: '2px 7px',
                }}>
                  {sessCount} session{sessCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {/* Skill name */}
            <div style={{ fontSize: 13, fontWeight: 600, color: '#64748B' }}>
              {cfg.label}
            </div>

            {/* Score + delta */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 34, fontWeight: 900,
                  color: scoreColor, lineHeight: 1,
                }}>
                  {score}
                </span>
                <span style={{ fontSize: 12, color: '#CBD5E1' }}>/100</span>
              </div>

              {delta !== null && (
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 8,
                  color: delta > 0 ? '#15803D' : delta < 0 ? '#B91C1C' : '#64748B',
                  background: delta > 0 ? 'rgba(16,185,129,0.10)' : delta < 0 ? 'rgba(239,68,68,0.10)' : 'rgba(100,116,139,0.10)',
                }}>
                  {delta > 0 ? `↑ +${delta}` : delta < 0 ? `↓ ${delta}` : '→ stable'}
                </span>
              )}
            </div>

            {/* Progress bar */}
            <div style={{ height: 6, borderRadius: 99, background: '#F1F5F9', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 99,
                width: `${score}%`,
                background: pal.bar,
                transition: 'width 700ms ease',
              }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
