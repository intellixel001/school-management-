'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, ChevronRight, BookOpen, PenLine, Mic2, Headphones } from 'lucide-react'
import { Avatar } from '@/components/ui'
import { getRelativeTime } from '@/lib/utils/time'
import { LEVEL_SHORT } from '@/lib/levelConfig'
import type { Student, Session, SkillLevel } from '@/types/platform'

// ── Design tokens ─────────────────────────────────────────────────────────────

const SKILL_COLORS = {
  reading:   '#6366F1',
  writing:   '#059669',
  speaking:  '#D97706',
  listening: '#3B82F6',
} as const

const SKILL_ICONS = {
  reading: BookOpen, writing: PenLine, speaking: Mic2, listening: Headphones,
} as const

const SKILL_ORDER = ['reading', 'writing', 'speaking', 'listening'] as const

const LEVEL_CONFIG: Record<SkillLevel, { text: string; bg: string; border: string }> = {
  'entry-1': { text: '#64748B', bg: 'rgba(100,116,139,0.10)', border: 'rgba(100,116,139,0.18)' },
  'entry-2': { text: '#D97706', bg: 'rgba(217,119,6,0.10)',   border: 'rgba(217,119,6,0.20)'   },
  'entry-3': { text: '#4D9FFF', bg: 'rgba(77,159,255,0.10)',  border: 'rgba(77,159,255,0.22)'  },
  'level-1': { text: '#059669', bg: 'rgba(5,150,105,0.10)',   border: 'rgba(5,150,105,0.20)'   },
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; label: string }> = {
  active:           { color: '#10B981', bg: 'rgba(16,185,129,0.10)',  border: 'rgba(16,185,129,0.20)', label: 'Active' },
  inactive:         { color: '#94A3B8', bg: 'rgba(148,163,184,0.10)', border: 'rgba(148,163,184,0.16)', label: 'Inactive' },
  'needs-attention':{ color: '#EF4444', bg: 'rgba(239,68,68,0.10)',   border: 'rgba(239,68,68,0.22)', label: 'Needs Attention' },
}

const FILTER_PILLS = [
  { id: 'all' as const,              label: 'All' },
  { id: 'active' as const,           label: 'Active' },
  { id: 'inactive' as const,         label: 'Inactive' },
  { id: 'needs-attention' as const,  label: 'Needs Attention' },
]

const PILL_ACTIVE_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  all:               { color: '#4D9FFF', bg: 'rgba(77,159,255,0.12)',   border: 'rgba(77,159,255,0.32)' },
  active:            { color: '#10B981', bg: 'rgba(16,185,129,0.12)',   border: 'rgba(16,185,129,0.32)' },
  inactive:          { color: '#94A3B8', bg: 'rgba(148,163,184,0.12)',  border: 'rgba(148,163,184,0.28)' },
  'needs-attention': { color: '#EF4444', bg: 'rgba(239,68,68,0.12)',    border: 'rgba(239,68,68,0.32)' },
}

type StatusFilter = keyof typeof PILL_ACTIVE_STYLE
type LevelFilter  = 'all' | SkillLevel

// ── Student card ──────────────────────────────────────────────────────────────

function StudentCard({ student, idx }: { student: Student; idx: number }) {
  const [hovered, setHovered] = useState(false)
  const router = useRouter()

  const avg = Math.round(
    (student.skills.reading + student.skills.writing + student.skills.speaking + student.skills.listening) / 4
  )
  const avgColor = avg >= 75 ? '#10B981' : avg >= 50 ? '#F59E0B' : '#EF4444'
  const lv = LEVEL_CONFIG[student.level] ?? LEVEL_CONFIG['entry-1']
  const st = STATUS_CONFIG[student.status] ?? STATUS_CONFIG.active

  return (
    <div
      onClick={() => router.push(`/teacher/students/${student.id}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '14px 18px',
        background: 'var(--bg-surface)',
        border: `1px solid ${hovered ? 'rgba(77,159,255,0.35)' : 'var(--border-default)'}`,
        borderRadius: 12, cursor: 'pointer',
        boxShadow: hovered ? '0 4px 18px rgba(77,159,255,0.08)' : '0 1px 3px rgba(0,0,0,0.04)',
        transform: hovered ? 'translateY(-1px)' : 'translateY(0)',
        transition: 'border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease',
        animationDelay: `${idx * 35}ms`,
      }}
      className="animate-[fadeSlideUp_280ms_ease-out_both]"
    >
      {/* Avatar */}
      <div style={{ flexShrink: 0 }}>
        <Avatar size="md" name={student.name} />
      </div>

      {/* Name + level + last active */}
      <div style={{ flex: '0 0 180px', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
            {student.name}
          </span>
          <span style={{
            fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px',
            color: lv.text, background: lv.bg, border: `1px solid ${lv.border}`,
            borderRadius: 4, padding: '1px 6px',
          }}>
            {LEVEL_SHORT[student.level]}
          </span>
        </div>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, display: 'block' }}>
          Last active {getRelativeTime(student.lastActive)}
        </span>
      </div>

      {/* Skill bars — shown lg+ */}
      <div className="hidden lg:flex" style={{ flex: 1, flexDirection: 'column', gap: 5 }}>
        {SKILL_ORDER.map(skill => {
          const score = student.skills[skill]
          const color = SKILL_COLORS[skill]
          const Icon  = SKILL_ICONS[skill]
          return (
            <div key={skill} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <Icon size={10} style={{ color, flexShrink: 0 }} />
              <div style={{ flex: 1, height: 5, background: 'var(--bg-surface-3)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ width: `${score}%`, height: '100%', background: color, borderRadius: 99, opacity: 0.85 }} />
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color, width: 22, textAlign: 'right', fontFamily: 'monospace' }}>
                {score}
              </span>
            </div>
          )
        })}
      </div>

      {/* Status pill — shown sm+ */}
      <div className="hidden sm:block" style={{
        fontSize: 11, fontWeight: 700,
        color: st.color, background: st.bg, border: `1px solid ${st.border}`,
        borderRadius: 20, padding: '3px 10px',
        whiteSpace: 'nowrap', flexShrink: 0,
      }}>
        {st.label}
      </div>

      {/* Avg score */}
      <div style={{
        fontSize: 26, fontWeight: 900, color: avgColor,
        fontFamily: 'monospace', flexShrink: 0, width: 50,
        textAlign: 'right', letterSpacing: '-0.5px',
      }}>
        {avg}
      </div>

      {/* Arrow */}
      <ChevronRight
        size={16}
        style={{ color: hovered ? '#4D9FFF' : 'var(--text-muted)', flexShrink: 0, transition: 'color 160ms ease' }}
      />
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface StudentListProps {
  students: Student[]
  sessions: Session[]
}

export function StudentList({ students }: StudentListProps) {
  const [search,       setSearch]  = useState('')
  const [statusFilter, setStatus]  = useState<StatusFilter>('all')
  const [levelFilter,  setLevel]   = useState<LevelFilter>('all')

  const filtered = students.filter(s => {
    if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false
    if (statusFilter !== 'all' && s.status !== statusFilter) return false
    if (levelFilter  !== 'all' && s.level  !== levelFilter)  return false
    return true
  })

  return (
    <>
      {/* ── Filter bar ──────────────────────────────────────────────────── */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 12, padding: '14px 16px',
        display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center',
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 160 }}>
          <Search size={13} style={{
            position: 'absolute', left: 11, top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)', pointerEvents: 'none',
          }} />
          <input
            type="text"
            placeholder="Search by name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '8px 12px 8px 32px',
              background: 'var(--bg-surface-2)',
              border: '1px solid var(--border-default)',
              borderRadius: 8,
              fontFamily: 'var(--font-body)', fontSize: 13,
              color: 'var(--text-primary)', outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 150ms ease, box-shadow 150ms ease',
            }}
            onFocus={e => {
              e.currentTarget.style.borderColor = '#4D9FFF'
              e.currentTarget.style.boxShadow   = '0 0 0 3px rgba(77,159,255,0.12)'
            }}
            onBlur={e => {
              e.currentTarget.style.borderColor = 'var(--border-default)'
              e.currentTarget.style.boxShadow   = 'none'
            }}
          />
        </div>

        {/* Status filter pills */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {FILTER_PILLS.map(pill => {
            const isActive = statusFilter === pill.id
            const ac       = PILL_ACTIVE_STYLE[pill.id]
            return (
              <button
                key={pill.id}
                type="button"
                onClick={() => setStatus(pill.id)}
                style={{
                  padding: '6px 13px',
                  borderRadius: 20,
                  border: `1.5px solid ${isActive ? ac.border : 'var(--border-default)'}`,
                  background: isActive ? ac.bg : 'transparent',
                  color: isActive ? ac.color : 'var(--text-secondary)',
                  fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: isActive ? 700 : 400,
                  cursor: 'pointer', outline: 'none', whiteSpace: 'nowrap',
                  transition: 'border-color 150ms ease, background 150ms ease, color 150ms ease',
                }}
              >
                {pill.label}
              </button>
            )
          })}
        </div>

        {/* Level select */}
        <select
          value={levelFilter}
          onChange={e => setLevel(e.target.value as LevelFilter)}
          style={{
            padding: '7px 12px',
            background: 'var(--bg-surface-2)',
            border: '1px solid var(--border-default)',
            borderRadius: 8,
            fontFamily: 'var(--font-body)', fontSize: 13,
            color: 'var(--text-primary)', cursor: 'pointer', outline: 'none',
          }}
          onFocus={e => { e.currentTarget.style.borderColor = '#4D9FFF' }}
          onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-default)' }}
        >
          <option value="all">All Levels</option>
          <option value="entry-1">Entry Level 1</option>
          <option value="entry-2">Entry Level 2</option>
          <option value="entry-3">Entry Level 3</option>
          <option value="level-1">Level 1</option>
        </select>
      </div>

      {/* ── Result count ─────────────────────────────────────────────────── */}
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: -8 }}>
        Showing <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{filtered.length}</span> of {students.length} students
      </div>

      {/* ── Student cards ─────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div style={{
          padding: '52px 20px', textAlign: 'center',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 12,
          fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-muted)',
        }}>
          No students match the current filters.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map((student, idx) => (
            <StudentCard key={student.id} student={student} idx={idx} />
          ))}
        </div>
      )}
    </>
  )
}
