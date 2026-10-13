'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { Avatar, Badge, ProgressBar } from '@/components/ui'
import { SKILL_CONFIG, SKILL_ORDER } from '@/lib/skillConfig'
import { formatDate, getRelativeTime } from '@/lib/utils/time'
import { LEVEL_SHORT } from '@/lib/levelConfig'
import type { Student, Session, SkillLevel } from '@/types/platform'

const LEVEL_VARIANT: Record<SkillLevel, 'default' | 'info' | 'success' | 'warning'> = {
  'entry-1': 'default',
  'entry-2': 'warning',
  'entry-3': 'info',
  'level-1': 'success',
}

const STATUS_LABEL: Record<string, string> = {
  'active':          'Active',
  'inactive':        'Inactive',
  'needs-attention': 'Needs Attention',
}

const STATUS_COLOR: Record<string, string> = {
  'active':          'var(--accent-success)',
  'inactive':        'var(--text-muted)',
  'needs-attention': 'var(--accent-warning)',
}

interface StudentDetailPanelProps {
  student: Student | null
  sessions: Session[]
  onClose: () => void
}

export function StudentDetailPanel({ student, sessions, onClose }: StudentDetailPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const isOpen   = student !== null

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  // Get sessions for this student from the passed-in sessions prop
  const studentSessions = student
    ? sessions
        .filter(s => s.studentId === student.id && s.status === 'completed')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : []

  const recentSessions  = studentSessions.slice(0, 3)
  const avgScore =
    studentSessions.length > 0
      ? Math.round(studentSessions.reduce((acc, s) => acc + s.score, 0) / studentSessions.length)
      : null

  const feedbackHistory = studentSessions.filter(s => s.teacherFeedback)

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.35)',
          zIndex: 200,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 300ms ease',
        }}
      />

      {/* Slide-in panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={student ? `${student.name} details` : 'Student details'}
        className="student-detail-panel"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 400,
          maxWidth: '90vw',
          background: 'var(--bg-surface)',
          borderLeft: '1px solid var(--border-default)',
          zIndex: 201,
          overflowY: 'auto',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 300ms ease-out',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
        }}
      >
        {student && (
          <div style={{ padding: '24px 22px' }}>

            {/* Close button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close panel"
                style={{
                  background: 'var(--bg-surface-2)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '4px 8px',
                  cursor: 'pointer',
                  outline: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  color: 'var(--text-muted)',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Student header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              <Avatar size="lg" name={student.name} />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 18,
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                    }}
                  >
                    {student.name}
                  </span>
                  <Badge variant={LEVEL_VARIANT[student.level] ?? 'default'} size="sm">
                    {LEVEL_SHORT[student.level]}
                  </Badge>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginTop: 4,
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: STATUS_COLOR[student.status],
                      display: 'inline-block',
                    }}
                  />
                  <span
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: 13,
                      color: 'var(--text-muted)',
                    }}
                  >
                    {STATUS_LABEL[student.status]}
                  </span>
                </div>
              </div>
            </div>

            {/* Dates */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
                marginBottom: 22,
              }}
            >
              <StatBlock label="Last active" value={getRelativeTime(student.lastActive)} />
              <StatBlock label="Enrolled" value={formatDate(student.enrolledDate, 'short')} />
            </div>

            <Divider />

            {/* Skill scores */}
            <SectionHeading>Skill Scores</SectionHeading>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {SKILL_ORDER.map(skill => {
                const config  = SKILL_CONFIG[skill]
                const score   = student.skills[skill]
                const variant = score < 50 ? 'danger' : score < 75 ? 'warning' : 'success'
                return (
                  <div key={skill} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <config.icon size={14} style={{ color: config.iconColor, flexShrink: 0, width: 14 }} />
                    <span
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: 13,
                        color: 'var(--text-secondary)',
                        width: 70,
                        flexShrink: 0,
                      }}
                    >
                      {config.label}
                    </span>
                    <div style={{ flex: 1 }}>
                      <ProgressBar value={score} variant={variant} size="sm" animated={false} />
                    </div>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 13,
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        width: 28,
                        textAlign: 'right',
                        flexShrink: 0,
                      }}
                    >
                      {score}
                    </span>
                  </div>
                )
              })}
            </div>

            <Divider />

            {/* ILP Targets */}
            <SectionHeading>ILP Targets</SectionHeading>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
              {student.ilpTargets.map(target => (
                <Badge key={target} variant="default" size="sm">{target}</Badge>
              ))}
            </div>

            <Divider />

            {/* Session summary */}
            <SectionHeading>Sessions</SectionHeading>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
                marginBottom: 20,
              }}
            >
              <StatBlock label="Total completed" value={String(student.completedSessions)} />
              <StatBlock label="Avg. score" value={avgScore !== null ? String(avgScore) : '—'} />
            </div>

            {/* Recent 3 sessions */}
            {recentSessions.length > 0 && (
              <>
                <SectionHeading>Recent Sessions</SectionHeading>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                  {recentSessions.map(session => {
                    const cfg     = SKILL_CONFIG[session.skillArea]
                    const variant = session.score < 50 ? 'danger' : session.score < 75 ? 'warning' : 'success'
                    return (
                      <div
                        key={session.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '8px 10px',
                          background: 'var(--bg-surface-2)',
                          borderRadius: 'var(--radius-md)',
                        }}
                      >
                        <cfg.icon size={14} style={{ color: cfg.iconColor, flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span
                            style={{
                              fontFamily: 'var(--font-body)',
                              fontSize: 13,
                              color: 'var(--text-primary)',
                              textTransform: 'capitalize',
                            }}
                          >
                            {cfg.label}
                          </span>
                          <span
                            style={{
                              fontFamily: 'var(--font-body)',
                              fontSize: 11,
                              color: 'var(--text-muted)',
                              marginLeft: 6,
                            }}
                          >
                            {formatDate(session.date, 'short')}
                          </span>
                        </div>
                        <Badge variant={variant} size="sm">{session.score}</Badge>
                      </div>
                    )
                  })}
                </div>
              </>
            )}

            {/* Feedback history */}
            {feedbackHistory.length > 0 && (
              <>
                <Divider />
                <SectionHeading>Feedback History</SectionHeading>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {feedbackHistory.map(session => (
                    <div
                      key={session.id}
                      style={{
                        background: 'var(--bg-surface-2)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        padding: '10px 12px',
                      }}
                    >
                      <div
                        style={{
                          fontFamily: 'var(--font-body)',
                          fontSize: 11,
                          color: 'var(--text-muted)',
                          marginBottom: 4,
                        }}
                      >
                        {formatDate(session.date, 'short')} · {SKILL_CONFIG[session.skillArea].label}
                      </div>
                      <p
                        style={{
                          fontFamily: 'var(--font-body)',
                          fontSize: 13,
                          color: 'var(--text-secondary)',
                          fontStyle: 'italic',
                          lineHeight: 1.5,
                          margin: 0,
                        }}
                      >
                        {session.teacherFeedback}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </>
  )
}

// ── Small helpers ─────────────────────────────────────────────────────────────

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)', marginBottom: 2, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
        {value}
      </div>
    </div>
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: 'var(--font-display)',
        fontSize: 13,
        fontWeight: 600,
        color: 'var(--text-primary)',
        marginBottom: 10,
        letterSpacing: '0.02em',
      }}
    >
      {children}
    </div>
  )
}

function Divider() {
  return (
    <div
      style={{
        height: 1,
        background: 'var(--border-subtle)',
        margin: '16px 0',
      }}
    />
  )
}
