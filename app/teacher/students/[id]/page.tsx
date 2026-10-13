export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getStudentById, getSessionsByStudentId, getStudentMockAttempts, getMockExam } from '@/lib/services'
import { formatDate, getRelativeTime } from '@/lib/utils/time'
import { SKILL_CONFIG, SKILL_ORDER } from '@/lib/skillConfig'
import { LEVEL_SHORT } from '@/lib/levelConfig'
import { ArrowLeft, Target, TrendingUp, MessageSquare } from 'lucide-react'
import { TeacherPageHero } from '../../_components/TeacherPageHero'
import { StudentLevelEditor } from './_components/StudentLevelEditor'
import type { Metadata } from 'next'
import type { SkillArea, SkillLevel } from '@/types/platform'

// ── Colour palettes ───────────────────────────────────────────────────────────

const SKILL_COLORS: Record<SkillArea, { from: string; to: string; bg: string; text: string }> = {
  reading:   { from: '#6366F1', to: '#818CF8', bg: 'rgba(99,102,241,0.09)',  text: '#6366F1' },
  writing:   { from: '#059669', to: '#34D399', bg: 'rgba(5,150,105,0.09)',   text: '#059669' },
  speaking:  { from: '#D97706', to: '#FCD34D', bg: 'rgba(217,119,6,0.09)',   text: '#D97706' },
  listening: { from: '#3B82F6', to: '#60A5FA', bg: 'rgba(59,130,246,0.09)', text: '#3B82F6' },
}

const LEVEL_CFG: Record<SkillLevel, { bg: string; text: string; border: string }> = {
  'entry-1': { bg: 'rgba(100,116,139,0.18)', text: '#94A3B8', border: 'rgba(100,116,139,0.28)' },
  'entry-2': { bg: 'rgba(217,119,6,0.18)',   text: '#FBBF24', border: 'rgba(217,119,6,0.30)'   },
  'entry-3': { bg: 'rgba(77,159,255,0.18)',  text: '#4D9FFF', border: 'rgba(77,159,255,0.30)'  },
  'level-1': { bg: 'rgba(16,185,129,0.18)',  text: '#10B981', border: 'rgba(16,185,129,0.30)'  },
}

const STATUS_CFG: Record<string, { color: string; label: string }> = {
  active:           { color: '#10B981', label: 'Active' },
  inactive:         { color: '#94A3B8', label: 'Inactive' },
  'needs-attention':{ color: '#EF4444', label: 'Needs Attention' },
  // Arch-5: pending students show a distinct amber pill on their detail page
  pending:          { color: '#F59E0B', label: 'Pending Approval' },
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params
  const student = await getStudentById(id)
  return {
    title: student ? `${student.name} — English AI Tutor` : 'Student — English AI Tutor',
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function StudentProfilePage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const student = await getStudentById(id)
  if (!student) notFound()

  const allSessions = await getSessionsByStudentId(student.id)
  // Quiz is a self-contained points feature, not a skill assessment — keep it
  // out of every teacher-facing activity/session surface.
  const sessions = allSessions
    .filter(s => s.status === 'completed' && s.source !== 'quiz')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const mockAttempts = await getStudentMockAttempts(student.id)
  
  // Group attempts by mockId
  const byMock = new Map<string, any[]>()
  for (const a of mockAttempts) {
    if (!byMock.has(a.mockExamId)) byMock.set(a.mockExamId, [])
    byMock.get(a.mockExamId)!.push(a)
  }
  
  const mockGroups = Array.from(byMock.entries()).map(([mockId, attempts]) => ({
    mockId,
    mockTitle: mockId,
    completedSections: attempts.filter(a => a.status === 'reviewed').length,
  }))

  const uniqueMockIds = Array.from(byMock.keys())
  const mocks = await Promise.all(uniqueMockIds.map(id => getMockExam(id)))
  const mockTitleById = new Map(
    mocks.filter(m => m !== null).map(m => [m!.id, m!.title])
  )
  
  mockGroups.forEach(g => {
    g.mockTitle = mockTitleById.get(g.mockId) ?? g.mockId
  })

  // ── Derived stats ──────────────────────────────────────────────────────────
  // Session.duration is in SECONDS (Phase 3 migration).
  const totalSeconds   = sessions.reduce((acc, s) => acc + s.duration, 0)
  const hoursPracticed = +(totalSeconds / 3600).toFixed(1)
  const avgScore       = sessions.length > 0
    ? Math.round(sessions.reduce((acc, s) => acc + s.score, 0) / sessions.length)
    : 0
  const skillOverallAvg = Math.round(
    (student.skills.reading + student.skills.writing + student.skills.speaking + student.skills.listening) / 4
  )

  // ── Weekly activity (last 8 weeks) ────────────────────────────────────────
  const now   = new Date()
  const weeks = Array.from({ length: 8 }, (_, i) => {
    const daysBack  = (7 - i) * 7
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - daysBack)
    weekStart.setHours(0, 0, 0, 0)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 7)
    const ws = sessions.filter(s => {
      const d = new Date(s.date)
      return d >= weekStart && d < weekEnd
    })
    return { label: `W${i + 1}`, count: ws.length }
  })
  const maxCount = Math.max(...weeks.map(w => w.count), 1)

  const feedbackSessions = sessions.filter(s => s.teacherFeedback)
  const initials = student.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  const lv = LEVEL_CFG[student.level] ?? LEVEL_CFG['entry-1']
  const st = STATUS_CFG[student.status] ?? STATUS_CFG.active

  const overallColor = skillOverallAvg >= 75 ? '#10B981' : skillOverallAvg >= 50 ? '#F59E0B' : '#EF4444'

  const STAT_CHIPS = [
    { label: 'Sessions',  value: String(student.completedSessions), color: '#4D9FFF' },
    { label: 'Streak',    value: `${student.streak}d`,              color: '#F59E0B' },
    { label: 'Overall',   value: String(skillOverallAvg),           color: overallColor },
    { label: 'Hours',     value: `${hoursPracticed}h`,              color: '#A78BFA' },
  ]

  return (
    <div style={{ width: '100%', maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 22 }}>

      {/* ── Breadcrumb ──────────────────────────────────────────────────────── */}
      <Link
        href="/teacher/students"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, width: 'fit-content',
          fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none',
          fontFamily: 'var(--font-body)',
          transition: 'color 150ms ease',
        }}
      >
        <ArrowLeft size={14} />
        Back to Students
      </Link>

      {/* ── Hero banner ─────────────────────────────────────────────────────── */}
      {/* ── Hero banner ─────────────────────────────────────────────────────── */}
      <TeacherPageHero
        eyebrow="Student profile"
        title={student.name}
        subtitle={`${LEVEL_SHORT[student.level]} · ${student.email}`}
        rightSlot={
          student.status !== 'pending'
            ? <StudentLevelEditor studentId={student.id} currentLevel={student.level} />
            : undefined
        }
      />

      {/* ── Main grid ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_290px]" style={{ gap: 20, alignItems: 'start' }}>

        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ── Skill Scores ─────────────────────────────────────────────── */}
          <section style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 14, padding: '22px 24px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Skill Scores
              </h2>
              <div style={{
                fontSize: 12, color: 'var(--text-muted)',
                background: 'var(--bg-surface-2)', borderRadius: 8,
                padding: '3px 10px', border: '1px solid var(--border-subtle)',
              }}>
                Avg session score:{' '}
                <span style={{ fontWeight: 700, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{avgScore}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SKILL_ORDER.map(skill => {
                const cfg   = SKILL_CONFIG[skill]
                const sc    = SKILL_COLORS[skill]
                const score = student.skills[skill]
                const skillSessions = sessions.filter(s => s.skillArea === skill)
                const skillAvg = skillSessions.length > 0
                  ? Math.round(skillSessions.reduce((a, s) => a + s.score, 0) / skillSessions.length)
                  : null
                return (
                  <div key={skill} style={{
                    padding: '14px 16px',
                    borderRadius: 10,
                    background: sc.bg,
                    border: `1px solid ${sc.from}20`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                        background: `${sc.from}20`, border: `1px solid ${sc.from}28`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <cfg.icon size={14} color={sc.text} strokeWidth={2.2} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, flex: 1, textTransform: 'capitalize', color: 'var(--text-primary)' }}>
                        {cfg.label}
                      </span>
                      <span style={{ fontSize: 26, fontWeight: 900, color: sc.text, fontFamily: 'monospace', lineHeight: 1, letterSpacing: '-1px' }}>
                        {score}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>/100</span>
                    </div>
                    <div style={{ height: 8, background: 'var(--bg-surface-3)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{
                        width: `${score}%`, height: '100%',
                        background: `linear-gradient(90deg, ${sc.from}80 0%, ${sc.to} 100%)`,
                        borderRadius: 99,
                        boxShadow: `0 0 10px ${sc.from}55`,
                      }} />
                    </div>
                    {skillAvg !== null && (
                      <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
                        Session avg: <span style={{ fontFamily: 'monospace', fontWeight: 700, color: sc.text }}>{skillAvg}</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>

          {/* ── Session History (timeline) ───────────────────────────────── */}
          <section style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 14, padding: '22px 24px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Session History
              </h2>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)' }}>
                {sessions.length} completed
              </span>
            </div>

            {sessions.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>
                No sessions yet
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {sessions.map((session, idx) => {
                  const sc         = SKILL_COLORS[session.skillArea as SkillArea]
                  const cfg        = SKILL_CONFIG[session.skillArea as SkillArea]
                  const isLast     = idx === sessions.length - 1
                  const scoreColor = session.score >= 75 ? '#10B981' : session.score >= 50 ? '#F59E0B' : '#EF4444'

                  return (
                    <div key={session.id} style={{ display: 'flex', gap: 12 }}>
                      {/* Timeline track */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{
                          width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                          background: sc.text, marginTop: 5,
                          boxShadow: `0 0 7px ${sc.text}80`,
                        }} />
                        {!isLast && (
                          <div style={{ width: 1, flex: 1, minHeight: 20, background: 'var(--border-subtle)', marginTop: 4 }} />
                        )}
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, paddingBottom: isLast ? 0 : 14 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                                {cfg.label}
                              </span>
                              {session.teacherFeedback && (
                                <MessageSquare size={11} style={{ color: '#4D9FFF', flexShrink: 0 }} />
                              )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                              <span style={{
                                fontSize: 10, fontWeight: 600, textTransform: 'capitalize',
                                color: sc.text, background: sc.bg, borderRadius: 4, padding: '1px 6px',
                              }}>
                                {session.skillArea}
                              </span>
                              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                {formatDate(session.date, 'short')} · {Math.round(session.duration / 60)} min · {session.questionsCorrect}/{session.questionsAttempted} correct
                              </span>
                            </div>
                          </div>
                          <div style={{
                            fontSize: 14, fontWeight: 900, color: scoreColor,
                            background: `${scoreColor}14`, borderRadius: 7,
                            padding: '3px 10px', fontFamily: 'monospace', flexShrink: 0,
                          }}>
                            {session.score}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* ── ILP Targets ─────────────────────────────────────────────── */}
          <section style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 14, padding: '18px 20px',
          }}>
            <h2 style={{
              fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700,
              color: 'var(--text-primary)', margin: '0 0 14px',
              display: 'flex', alignItems: 'center', gap: 7,
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 7,
                background: 'rgba(77,159,255,0.12)', border: '1px solid rgba(77,159,255,0.22)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Target size={13} style={{ color: '#4D9FFF' }} />
              </div>
              ILP Targets
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {student.ilpTargets.map(target => (
                <span key={target} style={{
                  fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600,
                  background: 'rgba(77,159,255,0.10)', color: '#4D9FFF',
                  border: '1px solid rgba(77,159,255,0.22)',
                  borderRadius: 6, padding: '4px 10px',
                }}>
                  {target}
                </span>
              ))}
            </div>
          </section>

          {/* ── Weekly Activity ──────────────────────────────────────────── */}
          <section style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 14, padding: '18px 20px',
          }}>
            <h2 style={{
              fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700,
              color: 'var(--text-primary)', margin: '0 0 18px',
              display: 'flex', alignItems: 'center', gap: 7,
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 7,
                background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.22)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <TrendingUp size={13} style={{ color: '#A78BFA' }} />
              </div>
              Weekly Activity
            </h2>

            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 72 }}>
              {weeks.map((week, i) => {
                const isCurrent = i === weeks.length - 1
                const heightPct = week.count > 0 ? Math.max((week.count / maxCount) * 100, 8) : 0
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    {/* Count label */}
                    <span style={{
                      fontSize: 9, fontFamily: 'monospace', fontWeight: 700,
                      color: isCurrent ? '#4D9FFF' : week.count > 0 ? 'var(--text-secondary)' : 'transparent',
                    }}>
                      {week.count > 0 ? week.count : '·'}
                    </span>

                    <div style={{ width: '100%', height: 52, display: 'flex', alignItems: 'flex-end' }}>
                      <div style={{
                        width: '100%', borderRadius: '4px 4px 0 0', minHeight: 3,
                        height: heightPct > 0 ? `${heightPct}%` : 3,
                        background: isCurrent
                          ? 'linear-gradient(180deg, #4D9FFF 0%, #0066CC 100%)'
                          : week.count > 0
                            ? 'linear-gradient(180deg, rgba(77,159,255,0.50) 0%, rgba(77,159,255,0.25) 100%)'
                            : 'var(--bg-surface-3)',
                        boxShadow: isCurrent ? '0 0 10px rgba(77,159,255,0.35)' : 'none',
                      }} />
                    </div>

                    <span style={{
                      fontFamily: 'monospace', fontSize: 9,
                      color: isCurrent ? '#4D9FFF' : 'var(--text-muted)',
                      fontWeight: isCurrent ? 700 : 400,
                    }}>
                      {week.label}
                    </span>
                  </div>
                )
              })}
            </div>

            <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)', margin: '10px 0 0' }}>
              Sessions per week · last 8 weeks
            </p>
          </section>

          {/* ── Feedback Given ───────────────────────────────────────────── */}
          <section style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 14, padding: '18px 20px',
          }}>
            <h2 style={{
              fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700,
              color: 'var(--text-primary)', margin: '0 0 14px',
              display: 'flex', alignItems: 'center', gap: 7,
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 7,
                background: 'rgba(77,159,255,0.12)', border: '1px solid rgba(77,159,255,0.22)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <MessageSquare size={13} style={{ color: '#4D9FFF' }} />
              </div>
              Feedback Given
              {feedbackSessions.length > 0 && (
                <span style={{
                  marginLeft: 'auto', fontSize: 11, fontWeight: 700,
                  color: '#4D9FFF', background: 'rgba(77,159,255,0.12)',
                  border: '1px solid rgba(77,159,255,0.22)',
                  borderRadius: 20, padding: '1px 8px',
                }}>
                  {feedbackSessions.length}
                </span>
              )}
            </h2>

            {feedbackSessions.length === 0 ? (
              <p style={{
                fontSize: 12, color: 'var(--text-muted)',
                textAlign: 'center', padding: '16px 0', margin: 0,
              }}>
                No feedback given yet
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {feedbackSessions.map(session => {
                  const sc = SKILL_COLORS[session.skillArea as SkillArea]
                  return (
                    <div key={session.id} style={{
                      background: 'var(--bg-surface-2)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 9, padding: '11px 13px',
                      borderLeft: `3px solid ${sc.text}`,
                    }}>
                      <div style={{
                        display: 'flex', justifyContent: 'space-between',
                        fontSize: 11, marginBottom: 6,
                      }}>
                        <span style={{
                          fontWeight: 700, textTransform: 'capitalize',
                          color: sc.text, background: sc.bg,
                          borderRadius: 4, padding: '1px 6px',
                        }}>
                          {session.skillArea}
                        </span>
                        <span style={{ color: 'var(--text-muted)' }}>
                          {formatDate(session.date, 'short')}
                        </span>
                      </div>
                      <p style={{
                        fontSize: 12, color: 'var(--text-secondary)',
                        fontStyle: 'italic', lineHeight: 1.55, margin: 0,
                      }}>
                        &ldquo;{session.teacherFeedback}&rdquo;
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          {/* ── Mock Tests ───────────────────────────────────────────── */}
          {mockGroups.length > 0 && (
            <section style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 14, padding: '18px 20px',
            }}>
              <h2 style={{
                fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700,
                color: 'var(--text-primary)', margin: '0 0 14px',
                display: 'flex', alignItems: 'center', gap: 7,
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 7,
                  background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.22)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Target size={13} style={{ color: '#10B981' }} />
                </div>
                Mock Tests
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {mockGroups.map(group => (
                  <div key={group.mockId} style={{ padding: 16, border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8, marginBottom: 12 }}>
                    <strong style={{ fontSize: 14, color: 'var(--text-primary)' }}>{group.mockTitle}</strong>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 10px' }}>Sections completed: {group.completedSections} of 3</div>
                    {group.completedSections > 0 && (
                      <a 
                        href={`/teacher/mock-reports/${group.mockId}/${student.id}`} 
                        target="_blank"
                        rel="noopener"
                        style={{ display: 'inline-flex', padding: '6px 12px', background: '#10B981', color: 'white', borderRadius: 6, fontSize: 12, textDecoration: 'none' }}
                      >
                        🖨 View / Print report →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>
      </div>
    </div>
  )
}
