// This page fetches auth-gated data (student list, sessions) from the backend.
// At build time there's no JWT, so prerender would 401. Force it to render
// per-request so the teacher's cookie is available.
export const dynamic = 'force-dynamic'

import { getStudents, getAllSessions } from '@/lib/services'
import { SKILL_ORDER } from '@/lib/skillConfig'
import { formatDate } from '@/lib/utils/time'
import { CohortSnapshot }     from './_components/CohortSnapshot'
import { SkillHealthTrends }  from './_components/SkillHealthTrends'
import { PerformanceTable }   from './_components/PerformanceTable'
import { AtRiskStudents }     from './_components/AtRiskStudents'
import { TeacherPageHero }    from '../_components/TeacherPageHero'
import type { Metadata } from 'next'
import type { SkillArea, Student } from '@/types/platform'

// ── Locked helper (shared formula across teacher pages) ────────────────────
function needsAttention(s: Student, now: Date): boolean {
  // Arch-5: pending students are not yet enrolled — exclude from attention logic.
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

export const metadata: Metadata = {
  title: 'Reports — English AI Tutor',
  description: 'Cohort analytics, skill health trends, and student performance breakdown.',
}

// ── Section card ──────────────────────────────────────────────────────────────

function Section({
  label,
  title,
  right,
  children,
}: {
  label?: string
  title: string
  right?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-default)',
      borderRadius: 14, overflow: 'hidden',
    }}>
      <div style={{
        padding: '16px 22px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--bg-surface-2)',
      }}>
        <div>
          {label && (
            <div style={{
              fontSize: 10, fontWeight: 700, color: '#4D9FFF',
              textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 3,
            }}>
              {label}
            </div>
          )}
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700,
            color: 'var(--text-primary)', margin: 0,
          }}>
            {title}
          </h2>
        </div>
        {right}
      </div>
      <div style={{ padding: '22px' }}>
        {children}
      </div>
    </section>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function ReportsPage() {
  const allStudents = await getStudents()
  const allRaw     = await getAllSessions()
  // Quiz is a self-contained points feature, not a skill assessment — keep it
  // out of every teacher-facing activity/session surface.
  const allSessions = allRaw.filter(s => s.status === 'completed' && s.source !== 'quiz')

  // Arch-5: exclude pending students from all report metrics.
  // They have no sessions, no scores, and empty lastActive/enrolledDate strings
  // that cause RangeError in date comparisons.
  const students = allStudents.filter(s => s.status !== 'pending')

  const now = new Date()

  function studentAvg(s: typeof students[number]): number {
    return (s.skills.reading + s.skills.writing + s.skills.speaking + s.skills.listening) / 4
  }

  // Guard: all stats default to 0 when no students enrolled
  const avgScore       = students.length === 0 ? 0 : Math.round((students.reduce((sum, s) => sum + studentAvg(s), 0) / students.length) * 10) / 10
  const passRate       = students.length === 0 ? 0 : Math.round((students.filter(s => studentAvg(s) >= 75).length / students.length) * 100)
  const completionRate = students.length === 0 ? 0 : Math.round((students.filter(s => s.completedSessions > 0).length / students.length) * 100)
  const totalSessions  = students.reduce((sum, s) => sum + s.completedSessions, 0)

  const currentAvgs: Record<SkillArea, number> = students.length === 0
    ? { reading: 0, writing: 0, speaking: 0, listening: 0 }
    : Object.fromEntries(
        SKILL_ORDER.map(skill => [
          skill,
          Math.round(students.reduce((sum, s) => sum + s.skills[skill], 0) / students.length),
        ])
      ) as Record<SkillArea, number>

  // prevAvgs: pass null to SkillHealthTrends — we have no historical baseline in dummy data.
  // Fake trend deltas removed (Arch-Phase-4). Once Django ships real history, compute from DB.
  const prevAvgs: Record<SkillArea, number> | null = null

  const skillPoints: Record<SkillArea, Array<{ score: number; date: string }>> = Object.fromEntries(
    SKILL_ORDER.map(skill => {
      const skillSessions = allSessions
        .filter(s => s.skillArea === skill)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-5)
      return [skill, skillSessions.map(s => ({ score: s.score, date: s.date }))]
    })
  ) as Record<SkillArea, Array<{ score: number; date: string }>>

  // at-risk: use real needsAttention formula (not stale student.status field)
  const atRiskStudents = students.filter(s => needsAttention(s, now))

  const todayStr = formatDate(new Date().toISOString(), 'long')

  return (
    <div style={{ width: '100%', maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Header banner ─────────────────────────────────────────────────── */}
      <TeacherPageHero
        eyebrow="Reports &amp; Analytics"
        title="Reports"
        subtitle={`Functional Skills Level 2 · Current Cohort · ${todayStr}`}
        rightSlot={
          <>
            {atRiskStudents.length > 0 ? (
              <div style={{
                background: 'rgba(239,68,68,0.12)', borderRadius: 10,
                padding: '8px 18px', border: '1px solid rgba(239,68,68,0.28)', textAlign: 'center',
              }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#F87171', fontFamily: 'monospace', lineHeight: 1 }}>
                  {atRiskStudents.length}
                </div>
                <div style={{ fontSize: 9, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 2 }}>
                  At Risk
                </div>
              </div>
            ) : (
              <div style={{
                background: 'rgba(16,185,129,0.10)', borderRadius: 10,
                padding: '8px 18px', border: '1px solid rgba(16,185,129,0.24)', textAlign: 'center',
              }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#10B981', lineHeight: 1 }}>✓</div>
                <div style={{ fontSize: 9, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 2 }}>
                  On Track
                </div>
              </div>
            )}
            <div style={{
              background: 'rgba(77,159,255,0.10)', borderRadius: 10,
              padding: '8px 18px', border: '1px solid rgba(77,159,255,0.22)', textAlign: 'center',
            }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#4D9FFF', fontFamily: 'monospace', lineHeight: 1 }}>
                {students.length}
              </div>
              <div style={{ fontSize: 9, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 2 }}>
                Students
              </div>
            </div>
          </>
        }
      />

      {/* ── Cohort Snapshot ───────────────────────────────────────────────────── */}
      <Section label="Overview" title="Cohort Snapshot">
        <CohortSnapshot
          avgScore={Math.round(avgScore)}
          passRate={passRate}
          completionRate={completionRate}
          totalSessions={totalSessions}
          studentCount={students.length}
          asOfDate={todayStr}
        />
      </Section>

      {/* ── Skill Health Trends ───────────────────────────────────────────────── */}
      <Section label="Trends" title="Skill Health Over Time">
        <SkillHealthTrends
          skillPoints={skillPoints}
          currentAvgs={currentAvgs}
          prevAvgs={prevAvgs}
        />
      </Section>

      {/* ── At-Risk Students (conditional) ───────────────────────────────────── */}
      {atRiskStudents.length > 0 && (
        <AtRiskStudents students={atRiskStudents} />
      )}

      {/* ── Performance Table ─────────────────────────────────────────────────── */}
      <Section label="Breakdown" title="Student Performance">
        <PerformanceTable students={students} />
      </Section>

    </div>
  )
}
