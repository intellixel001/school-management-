'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, PenLine, Mic2, Headphones, ChevronDown, CheckCircle } from 'lucide-react'
import { getRelativeTime } from '@/lib/utils/time'
import type { Session, Student, SkillArea } from '@/types/platform'

// ── Design tokens (match teacher portal vocabulary) ───────────────────────────

const SKILL_COLORS: Record<SkillArea, string> = {
  reading:   '#6366F1',
  writing:   '#059669',
  speaking:  '#D97706',
  listening: '#3B82F6',
}

const SKILL_ICONS: Record<SkillArea, React.ComponentType<{ size?: number; style?: React.CSSProperties }>> = {
  reading:   BookOpen,
  writing:   PenLine,
  speaking:  Mic2,
  listening: Headphones,
}

// ── Types ─────────────────────────────────────────────────────────────────────

type SkillFilter = 'all' | SkillArea
type SortKey     = 'date-desc' | 'date-asc' | 'student-asc'

interface Props {
  sessions:    Session[]
  studentById: Map<string, Student>
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function avatarInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

function scoreColor(score: number): string {
  if (score >= 75) return '#10B981'
  if (score >= 50) return '#F59E0B'
  return '#EF4444'
}

// ── Pill configs ──────────────────────────────────────────────────────────────

const SKILL_PILLS: Array<{ value: SkillFilter; label: string }> = [
  { value: 'all',       label: 'All Skills' },
  { value: 'reading',   label: 'Reading'    },
  { value: 'writing',   label: 'Writing'    },
  { value: 'speaking',  label: 'Speaking'   },
  { value: 'listening', label: 'Listening'  },
]

// ── Component ─────────────────────────────────────────────────────────────────

export function PracticeFeedbackQueueList({ sessions, studentById }: Props) {
  const router = useRouter()

  const [skillFilter,  setSkill]    = useState<SkillFilter>('all')
  const [sortKey,      setSort]     = useState<SortKey>('date-desc')
  const [hoveredId,    setHoveredId] = useState<string | null>(null)

  // ── Filter + sort ────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    return sessions
      .filter(s => skillFilter === 'all' || s.skillArea === skillFilter)
      .sort((a, b) => {
        if (sortKey === 'date-desc')   return new Date(b.date).getTime() - new Date(a.date).getTime()
        if (sortKey === 'date-asc')    return new Date(a.date).getTime() - new Date(b.date).getTime()
        if (sortKey === 'student-asc') {
          const nameA = studentById.get(a.studentId)?.name ?? ''
          const nameB = studentById.get(b.studentId)?.name ?? ''
          return nameA.localeCompare(nameB)
        }
        return 0
      })
  }, [sessions, skillFilter, sortKey, studentById])

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Filter bar ──────────────────────────────────────────────────────── */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 12,
        padding: '14px 16px',
        display: 'flex', flexWrap: 'wrap', alignItems: 'center',
        gap: 10,
      }}>
        {/* Skill chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, flex: 1 }}>
          {SKILL_PILLS.map(pill => {
            const isActive = skillFilter === pill.value
            const color    = pill.value === 'all' ? '#4D9FFF' : SKILL_COLORS[pill.value as SkillArea]
            return (
              <button
                key={pill.value}
                id={`skill-filter-${pill.value}`}
                onClick={() => setSkill(pill.value)}
                style={{
                  fontSize: 12, fontWeight: 600,
                  padding: '4px 12px', borderRadius: 20,
                  border: isActive ? `1.5px solid ${color}` : '1.5px solid transparent',
                  background: isActive ? `${color}14` : 'var(--bg-surface-2)',
                  color: isActive ? color : 'var(--text-muted)',
                  cursor: 'pointer', transition: 'all 140ms ease',
                  outline: 'none',
                }}
              >
                {pill.label}
              </button>
            )
          })}
        </div>

        {/* Sort dropdown */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <select
            id="sort-sessions"
            value={sortKey}
            onChange={e => setSort(e.target.value as SortKey)}
            style={{
              appearance: 'none', WebkitAppearance: 'none',
              padding: '6px 30px 6px 12px',
              fontSize: 12, fontWeight: 600,
              background: 'var(--bg-surface-2)',
              border: '1px solid var(--border-default)',
              borderRadius: 8, color: 'var(--text-secondary)',
              cursor: 'pointer', outline: 'none',
            }}
          >
            <option value="date-desc">Newest first</option>
            <option value="date-asc">Oldest first</option>
            <option value="student-asc">Student A–Z</option>
          </select>
          <ChevronDown
            size={13} strokeWidth={2.5}
            style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }}
          />
        </div>
      </div>

      {/* ── Result count ─────────────────────────────────────────────────────── */}
      <div style={{ fontSize: 12, color: 'var(--text-muted)', paddingLeft: 2 }}>
        {filtered.length} session{filtered.length !== 1 ? 's' : ''} awaiting feedback
      </div>

      {/* ── Queue rows ───────────────────────────────────────────────────────── */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 12, overflow: 'hidden',
      }}>
        {filtered.length === 0 ? (
          /* ── Empty state ─────────────────────────────────────────────────── */
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '56px 24px', textAlign: 'center', gap: 12,
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'rgba(16,185,129,0.10)',
              border: '1px solid rgba(16,185,129,0.20)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 4,
            }}>
              <CheckCircle size={24} style={{ color: '#10B981' }} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
              All caught up
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 320 }}>
              No practice sessions waiting for feedback.
            </div>
          </div>
        ) : (
          filtered.map((session, idx) => {
            const student    = studentById.get(session.studentId)
            const name       = student?.name ?? 'Unknown Student'
            const initials   = avatarInitials(name)
            const skillColor = SKILL_COLORS[session.skillArea]
            const SkillIcon  = SKILL_ICONS[session.skillArea]
            const sColor     = scoreColor(session.score)
            const isHovered  = hoveredId === session.id
            const isLast     = idx === filtered.length - 1

            return (
              <div
                key={session.id}
                id={`queue-row-${session.id}`}
                role="button"
                tabIndex={0}
                onClick={() => router.push(`/teacher/practice-feedback/${session.id}`)}
                onKeyDown={e => e.key === 'Enter' && router.push(`/teacher/practice-feedback/${session.id}`)}
                onMouseEnter={() => setHoveredId(session.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 16px',
                  borderBottom: isLast ? 'none' : '1px solid var(--border-subtle)',
                  background: isHovered ? 'var(--bg-surface-2)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'background 120ms ease',
                  outline: 'none',
                  borderLeft: `3px solid ${isHovered ? skillColor : 'transparent'}`,
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                  background: `linear-gradient(135deg, ${skillColor}40 0%, ${skillColor}20 100%)`,
                  border: `1px solid ${skillColor}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, color: skillColor,
                }}>
                  {initials}
                </div>

                {/* Student + skill */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>
                    {name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      fontSize: 11, fontWeight: 600, textTransform: 'capitalize',
                      color: skillColor, background: `${skillColor}14`,
                      borderRadius: 4, padding: '1px 7px',
                    }}>
                      <SkillIcon size={10} style={{ color: skillColor }} />
                      {session.skillArea}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {session.questionsCorrect}/{session.questionsAttempted} correct
                    </span>
                  </div>
                </div>

                {/* Score */}
                <div style={{
                  fontSize: 18, fontWeight: 900, color: sColor,
                  background: `${sColor}14`, borderRadius: 8,
                  padding: '4px 10px', fontFamily: 'monospace', flexShrink: 0,
                }}>
                  {session.score}
                </div>

                {/* Relative time */}
                <div style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0, minWidth: 72, textAlign: 'right' }}>
                  {getRelativeTime(session.date)}
                </div>

                {/* CTA */}
                <div style={{
                  fontSize: 12, fontWeight: 600, color: '#4D9FFF',
                  background: 'rgba(77,159,255,0.08)',
                  borderRadius: 8, padding: '5px 12px',
                  border: '1px solid rgba(77,159,255,0.18)',
                  flexShrink: 0, whiteSpace: 'nowrap',
                  transition: 'background 120ms ease, border-color 120ms ease',
                }}>
                  Give feedback →
                </div>
              </div>
            )
          })
        )}
      </div>
    </>
  )
}
