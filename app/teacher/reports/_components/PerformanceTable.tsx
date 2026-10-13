'use client'

import { useState, useMemo } from 'react'
import { SKILL_CONFIG, SKILL_ORDER } from '@/lib/skillConfig'
import { getRelativeTime } from '@/lib/utils/time'
import { LEVEL_SHORT } from '@/lib/levelConfig'
import type { Student, SkillArea, SkillLevel } from '@/types/platform'

// ── Constants ─────────────────────────────────────────────────────────────────

type SortKey = 'name' | 'score' | 'lastActive' | 'status'

const SKILL_COLORS: Record<SkillArea, string> = {
  reading:   '#6366F1',
  writing:   '#059669',
  speaking:  '#D97706',
  listening: '#3B82F6',
}

const STATUS_ORDER: Record<string, number> = {
  'needs-attention': 0,
  'inactive':        1,
  'active':          2,
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  'active':          { label: 'Active',        color: '#10B981', bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.22)'  },
  'inactive':        { label: 'Inactive',       color: '#94A3B8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.22)' },
  'needs-attention': { label: 'Needs Attn',     color: '#EF4444', bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.22)'   },
}

const LEVEL_COLORS: Record<SkillLevel, { color: string; bg: string; border: string }> = {
  'entry-1': { color: '#94A3B8', bg: 'rgba(148,163,184,0.10)', border: 'rgba(148,163,184,0.22)' },
  'entry-2': { color: '#F59E0B', bg: 'rgba(245,158,11,0.10)',  border: 'rgba(245,158,11,0.22)'  },
  'entry-3': { color: '#4D9FFF', bg: 'rgba(77,159,255,0.10)',  border: 'rgba(77,159,255,0.22)'  },
  'level-1': { color: '#10B981', bg: 'rgba(16,185,129,0.10)',  border: 'rgba(16,185,129,0.22)'  },
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function avatarInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

function calcAvg(s: Student): number {
  return Math.round((s.skills.reading + s.skills.writing + s.skills.speaking + s.skills.listening) / 4)
}

function scoreColor(score: number): string {
  if (score < 50) return '#EF4444'
  if (score < 75) return '#D97706'
  return '#10B981'
}

function scoreBg(score: number): string {
  if (score < 50) return 'rgba(239,68,68,0.07)'
  if (score < 75) return 'rgba(217,119,6,0.07)'
  return 'rgba(16,185,129,0.07)'
}

// ── Component ─────────────────────────────────────────────────────────────────

interface PerformanceTableProps {
  students: Student[]
}

export function PerformanceTable({ students }: PerformanceTableProps) {
  const [sortKey,   setSortKey]   = useState<SortKey>('score')
  const [fading,    setFading]    = useState(false)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  function handleSort(key: SortKey) {
    if (key === sortKey) return
    setFading(true)
    setTimeout(() => { setSortKey(key); setFading(false) }, 150)
  }

  const sorted = useMemo(() => {
    return [...students].sort((a, b) => {
      switch (sortKey) {
        case 'name':       return a.name.localeCompare(b.name)
        case 'score':      return calcAvg(b) - calcAvg(a)
        case 'lastActive':
          // Guard against empty lastActive strings (pending students, new enrollees)
          const bTime = b.lastActive ? new Date(b.lastActive).getTime() : 0
          const aTime = a.lastActive ? new Date(a.lastActive).getTime() : 0
          return bTime - aTime
        case 'status':     return STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
        default:           return 0
      }
    })
  }, [students, sortKey])

  const SORT_PILLS: Array<{ id: SortKey; label: string }> = [
    { id: 'score',      label: 'Score'       },
    { id: 'name',       label: 'Name'        },
    { id: 'lastActive', label: 'Last Active' },
    { id: 'status',     label: 'Status'      },
  ]

  return (
    <div>
      {/* Sort controls */}
      <div
        className="print-hide"
        style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}
      >
        <span style={{
          fontFamily: 'var(--font-body)', fontSize: 12,
          color: 'var(--text-muted)', marginRight: 4,
        }}>
          Sort by:
        </span>
        {SORT_PILLS.map(pill => {
          const active = sortKey === pill.id
          return (
            <button
              key={pill.id}
              type="button"
              onClick={() => handleSort(pill.id)}
              style={{
                padding: '5px 12px', borderRadius: 20,
                border: `1.5px solid ${active ? 'rgba(77,159,255,0.60)' : 'var(--border-default)'}`,
                background: active ? 'rgba(77,159,255,0.10)' : 'transparent',
                color: active ? '#4D9FFF' : 'var(--text-secondary)',
                fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: active ? 700 : 400,
                cursor: 'pointer', outline: 'none',
                transition: 'all 150ms ease',
              }}
            >
              {pill.label}
            </button>
          )
        })}
      </div>

      {/* Table */}
      <div
        className="perf-table-wrapper"
        style={{
          border: '1px solid var(--border-default)',
          borderRadius: 12, overflow: 'hidden',
        }}
      >
        <table
          style={{
            width: '100%', borderCollapse: 'collapse',
            opacity: fading ? 0.55 : 1,
            transition: 'opacity 150ms ease',
          }}
        >
          <thead>
            <tr style={{ background: 'var(--bg-surface-2)', borderBottom: '1px solid var(--border-subtle)' }}>
              {['Student', 'Level', 'Reading', 'Writing', 'Speaking', 'Listening', 'Overall', 'Sessions', 'Status', 'Last Active'].map(col => {
                const skillKey = col.toLowerCase() as SkillArea
                const isSkill  = SKILL_COLORS[skillKey] !== undefined
                const skillCol = isSkill ? skillKey : null
                return (
                  <th
                    key={col}
                    className={isSkill ? 'skill-col' : ''}
                    style={{
                      padding: '10px 10px',
                      fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700,
                      color: skillCol ? SKILL_COLORS[skillCol] : 'var(--text-muted)',
                      textAlign: col === 'Student' ? 'left' : 'center',
                      letterSpacing: '0.08em', textTransform: 'uppercase',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {skillCol ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
                        {(() => { const Icon = SKILL_CONFIG[skillCol].icon; return <Icon size={10} style={{ color: SKILL_COLORS[skillCol] }} /> })()}
                        {col}
                      </span>
                    ) : col}
                  </th>
                )
              })}
            </tr>
          </thead>

          <tbody>
            {sorted.map((student, idx) => {
              const avg     = calcAvg(student)
              const isLast  = idx === sorted.length - 1
              const hovered = hoveredId === student.id
              const statusCfg = STATUS_CONFIG[student.status] ?? STATUS_CONFIG['inactive']
              const levelCfg  = LEVEL_COLORS[student.level] ?? LEVEL_COLORS['entry-1']

              return (
                <tr
                  key={student.id}
                  onMouseEnter={() => setHoveredId(student.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className="report-table-row"
                  style={{
                    borderBottom: isLast ? 'none' : '1px solid var(--border-subtle)',
                    background: hovered ? 'var(--bg-surface-2)' : 'transparent',
                    transition: 'background 120ms ease',
                  }}
                >
                  {/* Student */}
                  <td style={{ padding: '10px 10px', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                        background: `linear-gradient(135deg, rgba(77,159,255,0.70) 0%, rgba(77,159,255,0.35) 100%)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, fontWeight: 700, color: '#FFF',
                      }}>
                        {avatarInitials(student.name)}
                      </div>
                      <span style={{
                        fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600,
                        color: 'var(--text-primary)',
                      }}>
                        {student.name}
                      </span>
                    </div>
                  </td>

                  {/* Level */}
                  <td style={{ padding: '10px 10px', textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center',
                      padding: '2px 8px', borderRadius: 7,
                      background: levelCfg.bg, border: `1px solid ${levelCfg.border}`,
                      fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700,
                      color: levelCfg.color,
                    }}>
                      {LEVEL_SHORT[student.level]}
                    </span>
                  </td>

                  {/* Skill scores */}
                  {SKILL_ORDER.map(skill => {
                    const sc    = student.skills[skill]
                    const sColor = SKILL_COLORS[skill]
                    return (
                      <td
                        key={skill}
                        className="skill-col"
                        style={{
                          padding: '10px 8px', textAlign: 'center',
                          background: hovered ? `${sColor}08` : scoreBg(sc),
                          transition: 'background 120ms ease',
                        }}
                      >
                        <span style={{
                          fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700,
                          color: scoreColor(sc),
                        }}>
                          {sc}
                        </span>
                      </td>
                    )
                  })}

                  {/* Overall */}
                  <td style={{ padding: '10px 10px', textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 800,
                      color: scoreColor(avg),
                      background: scoreBg(avg), border: `1px solid ${scoreColor(avg)}28`,
                      borderRadius: 8, padding: '2px 8px', minWidth: 38,
                    }}>
                      {avg}
                    </span>
                  </td>

                  {/* Sessions */}
                  <td style={{ padding: '10px 10px', textAlign: 'center' }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600,
                      color: 'var(--text-secondary)',
                    }}>
                      {student.completedSessions}
                    </span>
                  </td>

                  {/* Status */}
                  <td style={{ padding: '10px 10px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '3px 9px', borderRadius: 20,
                      background: statusCfg.bg, border: `1px solid ${statusCfg.border}`,
                      fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700,
                      color: statusCfg.color,
                    }}>
                      <span style={{
                        width: 5, height: 5, borderRadius: '50%',
                        background: statusCfg.color, flexShrink: 0,
                      }} />
                      {statusCfg.label}
                    </span>
                  </td>

                  {/* Last Active */}
                  <td style={{ padding: '10px 10px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <span style={{
                      fontFamily: 'var(--font-body)', fontSize: 12,
                      color: 'var(--text-muted)',
                    }}>
                      {getRelativeTime(student.lastActive)}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
