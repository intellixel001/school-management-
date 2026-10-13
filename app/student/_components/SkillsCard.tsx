'use client'

import Link from 'next/link'
import { SkillRing } from './SkillRing'
import type { Student } from '@/types/platform'
import { SKILL_CFG, SkillKey } from './sharedConfig'

export function SkillsCard({ student }: { student: Student }) {
  const skills = (['reading', 'writing', 'speaking', 'listening'] as SkillKey[]).map(id => ({
    id, ...SKILL_CFG[id], score: student.skills?.[id] ?? 0,
  }))
  const sorted = [...skills].sort((a, b) => b.score - a.score)
  const strongest = sorted[0].score > 0 ? sorted[0].label : null
  const weakest = sorted[sorted.length - 1].score > 0 ? sorted[sorted.length - 1].label : null

  return (
    <div style={{
      background: '#FFFFFF',
      borderRadius: 16,
      padding: '22px 24px',
      boxShadow: '0 1px 3px rgba(15,23,42,0.04), 0 0 0 1px rgba(99,102,241,0.10)',
      transition: 'box-shadow 200ms ease, transform 200ms ease',
    }}
    className="skills-card-hover">
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 22,
      }}>
        <h2 style={{
          margin: 0, fontSize: 17, fontWeight: 700, color: '#0F172A',
          fontFamily: 'var(--font-display)',
        }}>
          Your Skills
        </h2>
        <Link href="/student/progress" style={{
          fontSize: 13, color: '#6366F1', textDecoration: 'none', fontWeight: 600,
        }}>
          View progress →
        </Link>
      </div>

      {/* Rings */}
      <div className="skills-ring-row" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 16,
        padding: '4px 0 8px',
      }}>
        {skills.map(s => (
          <SkillRing
            key={s.id}
            label={s.label}
            score={s.score}
            color={s.color}
            gradFrom={s.gradFrom}
            gradTo={s.gradTo}
            Icon={s.Icon}
          />
        ))}
      </div>

      {/* Footer insight */}
      <div style={{
        marginTop: 18, paddingTop: 16, borderTop: '1px solid #F1F5F9',
        display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 12, color: '#64748B' }}>
          Strongest: <span style={{ color: '#0F172A', fontWeight: 700 }}>{strongest ?? '—'}</span>
        </span>
        <span style={{ fontSize: 12, color: '#64748B' }}>
          Focus on: <span style={{ color: '#4338CA', fontWeight: 700 }}>{weakest ?? '—'}</span>
        </span>
      </div>
    </div>
  )
}
