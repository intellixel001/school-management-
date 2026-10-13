// AtRiskStudents — rendered only when at-risk students exist (checked in page.tsx)

import Link from 'next/link'
import { AlertTriangle, ChevronRight } from 'lucide-react'
import { SKILL_CONFIG, SKILL_ORDER } from '@/lib/skillConfig'
import { getRelativeTime } from '@/lib/utils/time'
import type { Student, SkillArea } from '@/types/platform'

const SKILL_COLORS: Record<SkillArea, string> = {
  reading:   '#6366F1',
  writing:   '#059669',
  speaking:  '#D97706',
  listening: '#3B82F6',
}

function avatarInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

function calcAvg(s: Student): number {
  return Math.round((s.skills.reading + s.skills.writing + s.skills.speaking + s.skills.listening) / 4)
}

function weakestSkill(s: Student): SkillArea {
  return SKILL_ORDER.reduce((a, b) => s.skills[a] < s.skills[b] ? a : b)
}

interface AtRiskStudentsProps {
  students: Student[]
}

export function AtRiskStudents({ students }: AtRiskStudentsProps) {
  if (students.length === 0) return null

  return (
    <>
      {/* Pulse keyframe — scoped to this section */}
      <style>{`
        @keyframes at-risk-pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.45), 0 0 12px rgba(239,68,68,0.14); }
          50%      { box-shadow: 0 0 0 7px rgba(239,68,68,0), 0 0 18px rgba(239,68,68,0.20); }
        }
        @keyframes at-risk-border {
          0%,100% { border-color: rgba(239,68,68,0.25); }
          50%      { border-color: rgba(239,68,68,0.50); }
        }
      `}</style>

      <div style={{
        background: 'var(--bg-surface)',
        borderRadius: 14, overflow: 'hidden',
        animation: 'at-risk-border 3s ease-in-out infinite',
        border: '1px solid rgba(239,68,68,0.25)',
      }}>
        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div style={{
          padding: '18px 22px',
          background: 'linear-gradient(135deg, #1A0A0A 0%, #1C0D0D 50%, #180A10 100%)',
          borderBottom: '1px solid rgba(239,68,68,0.18)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Pulsing icon */}
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: 'rgba(239,68,68,0.16)',
              border: '1px solid rgba(239,68,68,0.30)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: 'at-risk-pulse 2.4s ease-in-out infinite',
            }}>
              <AlertTriangle size={17} style={{ color: '#F87171' }} />
            </div>
            <div>
              <div style={{
                fontSize: 10, color: '#F87171', fontWeight: 700,
                letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 3,
              }}>
                Action Recommended
              </div>
              <div style={{
                fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800,
                color: '#F1F5F9',
              }}>
                Needs Attention
              </div>
            </div>
          </div>

          {/* Count badge */}
          <div style={{
            background: 'rgba(239,68,68,0.14)',
            border: '1px solid rgba(239,68,68,0.30)',
            borderRadius: 12, padding: '8px 18px', textAlign: 'center',
          }}>
            <div style={{
              fontFamily: 'monospace', fontSize: 24, fontWeight: 800,
              color: '#F87171', lineHeight: 1,
            }}>
              {students.length}
            </div>
            <div style={{
              fontSize: 9, color: '#94A3B8', fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 2,
            }}>
              {students.length === 1 ? 'Student' : 'Students'}
            </div>
          </div>
        </div>

        {/* ── Student rows ─────────────────────────────────────────────────── */}
        <div style={{ padding: '16px 22px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {students.map(student => {
            const avg        = calcAvg(student)
            const weak       = weakestSkill(student)
            const weakCfg    = SKILL_CONFIG[weak]
            const weakColor  = SKILL_COLORS[weak]
            const scoreColor = avg < 50 ? '#EF4444' : '#D97706'

            return (
              <Link
                key={student.id}
                href={`/teacher/students/${student.id}`}
                style={{ textDecoration: 'none' }}
              >
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
                  padding: '11px 14px',
                  background: 'var(--bg-surface-2)',
                  border: '1px solid var(--border-subtle)',
                  borderLeft: '3px solid #EF4444',
                  borderRadius: 10,
                  cursor: 'pointer',
                  transition: 'background 150ms ease, border-color 150ms ease',
                }}>
                  {/* Avatar */}
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, rgba(239,68,68,0.70) 0%, rgba(239,68,68,0.38) 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, color: '#FFF',
                  }}>
                    {avatarInitials(student.name)}
                  </div>

                  {/* Name */}
                  <span style={{
                    fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600,
                    color: 'var(--text-primary)', minWidth: 130,
                  }}>
                    {student.name}
                  </span>

                  {/* Weakest skill chip */}
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '3px 9px', borderRadius: 7,
                    background: `${weakColor}10`, border: `1px solid ${weakColor}22`,
                  }}>
                    <weakCfg.icon size={11} style={{ color: weakColor }} />
                    <span style={{
                      fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600,
                      color: weakColor,
                    }}>
                      {weakCfg.label}: {student.skills[weak]}
                    </span>
                  </div>

                  {/* Overall score badge */}
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 800,
                    color: scoreColor,
                    padding: '2px 8px', borderRadius: 7,
                    background: `${scoreColor}0E`, border: `1px solid ${scoreColor}28`,
                  }}>
                    {avg}
                  </span>

                  {/* Last active + view arrow */}
                  <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)',
                    }}>
                      {getRelativeTime(student.lastActive)}
                    </span>
                    <ChevronRight size={14} style={{ color: '#4D9FFF', flexShrink: 0 }} />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        <div style={{ padding: '10px 22px 16px', borderTop: '1px solid var(--border-subtle)' }}>
          <p style={{
            fontFamily: 'var(--font-body)', fontSize: 12,
            color: 'var(--text-muted)', margin: 0,
          }}>
            Click any student to view their full profile and session history.
          </p>
        </div>
      </div>
    </>
  )
}
