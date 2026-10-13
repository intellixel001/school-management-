'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Student } from '@/types/platform'
import { Avatar, Tooltip } from '@/components/ui'
import { getRelativeTime } from '@/lib/utils/time'
import { LEVEL_SHORT, LEVEL_LABEL } from '@/lib/levelConfig'

interface StudentStatusListProps {
  students: Student[]
}

const SKILL_ORDER = ['reading', 'writing', 'speaking', 'listening'] as const

const SKILL_COLORS: Record<typeof SKILL_ORDER[number], string> = {
  reading:   '#6366F1',
  writing:   '#059669',
  speaking:  '#D97706',
  listening: '#3B82F6',
}

const STATUS_CONFIG = {
  'needs-attention': { label: 'Needs attention', color: '#EF4444', bg: 'rgba(239,68,68,0.10)', border: 'rgba(239,68,68,0.18)' },
  inactive:          { label: 'Inactive',         color: '#94A3B8', bg: 'rgba(148,163,184,0.10)', border: 'rgba(148,163,184,0.14)' },
  active:            { label: 'Active',            color: '#10B981', bg: 'rgba(16,185,129,0.10)', border: 'rgba(16,185,129,0.18)' },
  // Arch-5: pending students are excluded from sortedStudents but STATUS_CONFIG must cover the full union
  pending:           { label: 'Pending',           color: '#F59E0B', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.18)' },
  rejected:          { label: 'Rejected',          color: '#EF4444', bg: 'rgba(239,68,68,0.10)', border: 'rgba(239,68,68,0.18)' },
}

function SkillMiniBars({ student }: { student: Student }) {
  const tooltipContent = `Reading: ${student.skills.reading} · Writing: ${student.skills.writing} · Speaking: ${student.skills.speaking} · Listening: ${student.skills.listening}`

  return (
    <Tooltip content={tooltipContent}>
      <div className="hidden sm:flex" style={{ alignItems: 'center', gap: 4, flexShrink: 0 }}>
        {SKILL_ORDER.map(skill => {
          const score  = student.skills[skill]
          const color  = SKILL_COLORS[skill]
          const filled = Math.round((score / 100) * 34)
          return (
            <div key={skill} style={{
              width: 34, height: 5, borderRadius: 99,
              background: 'var(--bg-surface-3)', overflow: 'hidden', flexShrink: 0,
            }}>
              <div style={{
                width: filled, height: '100%',
                background: color, borderRadius: 99,
              }} />
            </div>
          )
        })}
      </div>
    </Tooltip>
  )
}

function StudentRow({ student, isLast }: { student: Student; isLast: boolean }) {
  const [hovered, setHovered] = useState(false)
  const router = useRouter()
  const cfg    = STATUS_CONFIG[student.status] ?? STATUS_CONFIG.active
  const avg    = Math.round(
    (student.skills.reading + student.skills.writing + student.skills.speaking + student.skills.listening) / 4
  )
  const avgColor = avg >= 75 ? '#10B981' : avg >= 50 ? '#F59E0B' : '#EF4444'

  return (
    <div
      onClick={() => router.push(`/teacher/students/${student.id}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 8px',
        margin: '0 -8px',
        borderBottom: isLast ? 'none' : '1px solid var(--border-subtle)',
        background: hovered ? 'var(--bg-surface-2)' : 'transparent',
        borderRadius: 8,
        transition: 'background 150ms ease',
        cursor: 'pointer',
      }}
    >
      <Avatar name={student.name} size="sm" />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <span style={{
            fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500,
            color: 'var(--text-primary)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {student.name}
          </span>
          <Tooltip content={LEVEL_LABEL[student.level]}>
            <span style={{
              fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700,
              color: 'var(--text-secondary)',
              background: 'var(--bg-surface-2)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 4, padding: '1px 5px',
              flexShrink: 0, lineHeight: 1.4,
            }}>
              {LEVEL_SHORT[student.level]}
            </span>
          </Tooltip>
        </div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
          Last active {getRelativeTime(student.lastActive)}
        </div>
      </div>

      <SkillMiniBars student={student} />

      {/* Avg score badge */}
      <div className="hidden sm:block" style={{
        fontSize: 13, fontWeight: 800, color: avgColor,
        background: `${avgColor}15`, borderRadius: 7,
        padding: '2px 9px', fontFamily: 'monospace', flexShrink: 0,
      }}>
        {avg}
      </div>

      {/* Status pill */}
      <div style={{
        fontSize: 11, fontWeight: 700,
        color: cfg.color,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        borderRadius: 20, padding: '2px 8px',
        whiteSpace: 'nowrap', flexShrink: 0,
      }}>
        {cfg.label}
      </div>
    </div>
  )
}

export function StudentStatusList({ students }: StudentStatusListProps) {
  return (
    <div>
      {students.map((student, idx) => (
        <StudentRow key={student.id} student={student} isLast={idx === students.length - 1} />
      ))}
    </div>
  )
}
