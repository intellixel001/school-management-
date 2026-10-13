'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getStudents, getAllSessions, getTeacher, getPendingStudents, getPendingPracticeFeedback, ServiceError } from '@/lib/services'
import { formatDate, getRelativeTime } from '@/lib/utils/time'
import Link from 'next/link'


import { AlertBanner }       from './_components/AlertBanner'
import { StatGrid }          from './_components/StatGrid'
import { StudentStatusList } from './_components/StudentStatusList'
import { ReviewQueueCard }   from './_components/ReviewQueueCard'
import PendingApprovalsList  from './_components/PendingApprovalsList'
import { TeacherPageHero }   from './_components/TeacherPageHero'
import { useTeacherSession } from './_components/TeacherSessionProvider'

import { Avatar, Spinner } from '@/components/ui'
import { BookOpen, PenLine, Mic2, Headphones } from 'lucide-react'
import type { Student, Session, Teacher } from '@/types/platform'

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

// ── Locked helper: compute "needs attention" from real activity data ───────────
// Criteria (Arch-Phase-4, decision #3):
//   a) completedSessions === 0  (never practised)
//   b) any skill score < 40
//   c) streak === 0 AND last active > 7 days ago

function needsAttention(s: Student, now: Date): boolean {
  // Arch-5: pending students are not yet enrolled — exclude them from all attention logic.
  if (s.status === 'pending') return false
  if (s.completedSessions === 0) return true
  if (
    s.skills.reading  < 40 ||
    s.skills.writing  < 40 ||
    s.skills.speaking < 40 ||
    s.skills.listening < 40
  ) return true
  const lastActive = s.lastActive ? new Date(s.lastActive) : null
  const daysSince  = lastActive
    ? (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24)
    : Infinity
  if (s.streak === 0 && daysSince > 7) return true
  return false
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function TeacherDashboard() {
  const router = useRouter()
  const { session, logout } = useTeacherSession()
  const [teacher, setTeacher] = useState<Teacher | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [allSessions, setAllSessions] = useState<Session[]>([])
  const [pendingStudents, setPendingStudents] = useState<Student[]>([])
  const [pendingSessions, setPendingSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadData() {
      try {
        const [tch, stus, sess, pStus, pSess] = await Promise.all([
          getTeacher(),
          getStudents(),
          getAllSessions(),
          getPendingStudents(),
          getPendingPracticeFeedback(),
        ])
        if (!cancelled) {
          setTeacher(tch)
          setStudents(stus)
          setAllSessions(sess)
          setPendingStudents(pStus)
          setPendingSessions(pSess)
        }
      } catch (err) {
        console.error('Failed to load teacher dashboard data:', err)
        if (
          err instanceof ServiceError &&
          (err.code === 'UNAUTHORIZED' ||
            err.message.toLowerCase().includes('token') ||
            err.message.toLowerCase().includes('credential'))
        ) {
          logout()
          router.replace('/teacher/login')
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    loadData()
    return () => { cancelled = true }
  }, [session, logout, router])


  const now = new Date()

  if (isLoading || !teacher) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Spinner size="lg" />
      </div>
    )
  }



  // Arch-5: exclude pending students from all cohort stats.
  // They haven't been assessed yet and should not skew averages or attention counts.
  const cohortStudents = students.filter(s => s.status !== 'pending')

  // ── Cohort computations ───────────────────────────────────────────────────

  const needAttentionCount = cohortStudents.filter(s => needsAttention(s, now)).length

  // Guard against empty cohort (division by zero)
  const cohortAvg = cohortStudents.length === 0
    ? 0
    : Math.round(
        cohortStudents.reduce((sum, s) =>
          sum + (s.skills.reading + s.skills.writing + s.skills.speaking + s.skills.listening) / 4
        , 0) / cohortStudents.length
      )

  const skillAreas = ['reading', 'writing', 'speaking', 'listening'] as const
  type SkillArea = typeof skillAreas[number]

  const cohortSkillAverages: Record<SkillArea, number> = cohortStudents.length === 0
    ? { reading: 0, writing: 0, speaking: 0, listening: 0 }
    : Object.fromEntries(
        skillAreas.map(area => [
          area,
          Math.round(cohortStudents.reduce((sum, s) => sum + s.skills[area], 0) / cohortStudents.length),
        ])
      ) as Record<SkillArea, number>

// Guard: if all averages are 0, no meaningful "weakest" — use reading as fallback
  const allZero    = skillAreas.every(a => cohortSkillAverages[a] === 0)
  const weakestSkill = allZero
    ? null
    : skillAreas.reduce((a, b) =>
        cohortSkillAverages[a] <= cohortSkillAverages[b] ? a : b
      )

  // ── Sorted data ───────────────────────────────────────────────────────────
  // Sort by real "needs attention" flag first, then by last active (most stale first)

  const sortedStudents = cohortStudents.length === 0
    ? []
    : [...cohortStudents]
        .sort((a, b) => {
          const aNeed = needsAttention(a, now) ? 0 : 1
          const bNeed = needsAttention(b, now) ? 0 : 1
          if (aNeed !== bNeed) return aNeed - bNeed
          // Secondary: last active ascending (longest-inactive first)
          const aTime = a.lastActive ? new Date(a.lastActive).getTime() : 0
          const bTime = b.lastActive ? new Date(b.lastActive).getTime() : 0
          return aTime - bTime
        })
        .slice(0, 6)

  // Quiz is a self-contained points feature, not a skill assessment — keep it
  // out of every teacher-facing activity/session surface.
  const recentSessions = [...allSessions]
    .filter(s => s.status === 'completed' && s.source !== 'quiz')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)

  // ── Time-of-day ───────────────────────────────────────────────────────────

  const hasPending = teacher.pendingReviews > 0
  const todayStr   = formatDate(new Date().toISOString(), 'long')
  const hour       = new Date().getHours()
  const timeOfDay  = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'
  const firstName  = 'Korani' // TEMP HARD-CODED for demo; restore: teacher.name.split(' ')[0]

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-6">

      {/* ── Hero banner ──────────────────────────────────────────────────────── */}
      <TeacherPageHero
        eyebrow="Nelson College London"
        title={`Good ${timeOfDay}, ${firstName} 👋`}
        subtitle={todayStr}
        rightSlot={
          <>
            <div style={{ background: 'rgba(77,159,255,0.12)', borderRadius: 12, padding: '10px 18px', border: '1px solid rgba(77,159,255,0.22)', textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#4D9FFF', fontFamily: 'monospace', lineHeight: 1 }}>{cohortStudents.length}</div>
              <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 3 }}>Students</div>
            </div>
            {hasPending && (
              <div style={{ background: 'rgba(239,68,68,0.12)', borderRadius: 12, padding: '10px 18px', border: '1px solid rgba(239,68,68,0.28)', textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#F87171', fontFamily: 'monospace', lineHeight: 1 }}>{teacher.pendingReviews}</div>
                <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 3 }}>Pending</div>
              </div>
            )}
          </>
        }
      />

      {/* ── Alert banner ─────────────────────────────────────────────────────── */}
      <AlertBanner
        pendingReviews={teacher.pendingReviews}
        pendingFeedback={pendingSessions.length}
      />

      {/* ── Pending Approvals (Arch-5) — hidden when pendingStudents.length === 0 ── */}
      {pendingStudents.length > 0 && (
        <PendingApprovalsList students={pendingStudents} />
      )}

      {/* ── Stat cards ───────────────────────────────────────────────────────── */}
      <StatGrid
        totalStudents={cohortStudents.length}
        needAttention={needAttentionCount}
        pendingReviews={teacher.pendingReviews}
        pendingPracticeFeedback={pendingSessions.length}
      />

      {/* ── Main two-column grid ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">

        {/* Left column */}
        <div className="flex flex-col gap-6">

          {/* ── Cohort Skill Health ─────────────────────────────────────────── */}
          <section style={{
            background: 'var(--bg-surface)',
            borderRadius: 14, padding: '22px',
            border: '1px solid var(--border-default)',
          }}>
            {/* Section header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Cohort Skill Health
                </h2>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', margin: '3px 0 0' }}>
                  {cohortStudents.length === 0
                    ? 'No students enrolled yet.'
                    : `Average scores across ${cohortStudents.length} student${cohortStudents.length !== 1 ? 's' : ''}`}
                </p>
              </div>
              {weakestSkill !== null && (
                <div style={{
                  fontSize: 12, color: 'var(--text-secondary)',
                  background: 'var(--bg-surface-2)', borderRadius: 8,
                  padding: '4px 10px', border: '1px solid var(--border-subtle)',
                  whiteSpace: 'nowrap',
                }}>
                  Weakest:{' '}
                  <span style={{ fontWeight: 700, color: SKILL_COLORS[weakestSkill], textTransform: 'capitalize' }}>
                    {weakestSkill}
                  </span>
                </div>
              )}
            </div>

            {cohortStudents.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>
                No students enrolled yet.
              </p>
            ) : (
              /* 2×2 skill mini-cards */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {skillAreas.map(area => {
                  const avg   = cohortSkillAverages[area]
                  const color = SKILL_COLORS[area]
                  const Icon  = SKILL_ICONS[area]
                  return (
                    <div key={area} style={{
                      padding: '14px 16px',
                      borderRadius: 10,
                      background: `${color}07`,
                      border: `1px solid ${color}1E`,
                    }}>
                      {/* Top: icon + name + score */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                          background: `${color}18`,
                          border: `1px solid ${color}28`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Icon size={15} style={{ color }} />
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 600, flex: 1, textTransform: 'capitalize', color: 'var(--text-primary)' }}>
                          {area}
                        </span>
                        <span style={{ fontSize: 26, fontWeight: 900, color, fontFamily: 'monospace', lineHeight: 1, letterSpacing: '-1px' }}>
                          {avg}
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>/100</span>
                      </div>

                      {/* Glowing progress bar */}
                      <div style={{ height: 8, background: 'var(--bg-surface-3)', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{
                          width: `${avg}%`, height: '100%',
                          background: `linear-gradient(90deg, ${color}70 0%, ${color} 100%)`,
                          borderRadius: 99,
                          boxShadow: `0 0 10px ${color}55`,
                        }} />
                      </div>

                    </div>
                  )
                })}
              </div>
            )}
          </section>

          {/* ── Students section ───────────────────────────────────────────── */}
          <section style={{
            background: 'var(--bg-surface)',
            borderRadius: 14, padding: '22px',
            border: '1px solid var(--border-default)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Students
                </h2>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', margin: '3px 0 0' }}>
                  Sorted by priority — attention first
                </p>
              </div>
              <Link
                href="/teacher/students"
                style={{
                  fontSize: 12, fontWeight: 600, color: '#4D9FFF',
                  textDecoration: 'none',
                  background: 'rgba(77,159,255,0.08)', borderRadius: 8,
                  padding: '5px 12px', border: '1px solid rgba(77,159,255,0.18)',
                }}
              >
                View all →
              </Link>
            </div>
            {sortedStudents.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>
                No students enrolled yet.
              </p>
            ) : (
              <StudentStatusList students={sortedStudents} />
            )}
          </section>

        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">

          {/* ── Feedback Queue ─────────────────────────────────────────────── */}
          <ReviewQueueCard
            pendingReviews={teacher.pendingReviews}
          />

          {/* ── Recent Activity (timeline) ─────────────────────────────────── */}
          <div style={{
            background: 'var(--bg-surface)',
            borderRadius: 14, padding: '18px',
            border: '1px solid var(--border-default)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Recent Activity
              </h3>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Last 5 sessions</span>
            </div>

            {recentSessions.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>
                No recent activity yet.
              </p>
            ) : (
              /* Timeline */
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {recentSessions.map((session, idx) => {
                  const isLast     = idx === recentSessions.length - 1
                  const student    = students.find(s => s.id === session.studentId)
                  const fName      = student?.name.split(' ')[0] ?? 'Student'
                  const skillColor = SKILL_COLORS[session.skillArea as keyof typeof SKILL_COLORS] ?? '#64748B'
                  const scoreColor = session.score >= 75 ? '#10B981' : session.score >= 50 ? '#F59E0B' : '#EF4444'

                  return (
                    <div key={session.id} style={{ display: 'flex', gap: 12 }}>
                      {/* Timeline track */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{
                          width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                          background: skillColor, marginTop: 5,
                          boxShadow: `0 0 7px ${skillColor}80`,
                        }} />
                        {!isLast && (
                          <div style={{
                            width: 1, flex: 1, minHeight: 20,
                            background: 'var(--border-subtle)', marginTop: 4,
                          }} />
                        )}
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, paddingBottom: isLast ? 0 : 14 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <Avatar name={student?.name ?? ''} size="sm" />
                              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{fName}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
                              <span style={{
                                fontSize: 10, fontWeight: 600, textTransform: 'capitalize',
                                color: skillColor, background: `${skillColor}18`,
                                borderRadius: 4, padding: '1px 6px',
                              }}>
                                {session.skillArea}
                              </span>
                              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                {getRelativeTime(session.date)}
                              </span>
                            </div>
                          </div>
                          <div style={{
                            fontSize: 13, fontWeight: 900, color: scoreColor,
                            background: `${scoreColor}14`, borderRadius: 7,
                            padding: '3px 9px', fontFamily: 'monospace', flexShrink: 0,
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
          </div>

        </div>
      </div>
    </div>
  )
}
