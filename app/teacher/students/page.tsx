export const dynamic = 'force-dynamic'

import { getStudents, getAllSessions } from '@/lib/services'
import { StudentList } from './_components/StudentList'
import { TeacherPageHero } from '../_components/TeacherPageHero'
import type { Metadata } from 'next'
import type { Student } from '@/types/platform'

// ── Locked helper (mirrors app/teacher/page.tsx) ─────────────────────────────
// Compute "needs attention" from real activity — not student.status field.
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
  title: 'Students — English AI Tutor',
  description: 'View and manage your cohort of English AI Tutor learners.',
}

export default async function StudentsPage() {
  // Arch-5: exclude pending students from the cohort list and its stats.
  // An unapproved account is not usable, so it is not part of the cohort — it
  // stays in "Pending Approvals" on the dashboard until a teacher approves it.
  const students    = (await getStudents()).filter(s => s.status !== 'pending')
  // Quiz is a self-contained points feature, not a skill assessment — keep it
  // out of every teacher-facing activity/session surface.
  const sessions    = (await getAllSessions()).filter(s => s.source !== 'quiz')

  const now = new Date()

  // Compute from real activity data (not student.status)
  const activeCount    = students.filter(s => !needsAttention(s, now)).length
  const attentionCount = students.filter(s => needsAttention(s, now)).length
  // Guard: avoid division by zero if cohort is empty
  const cohortAvg = students.length === 0
    ? 0
    : Math.round(
        students.reduce((sum, s) =>
          sum + (s.skills.reading + s.skills.writing + s.skills.speaking + s.skills.listening) / 4
        , 0) / students.length
      )

  return (
    <div style={{ width: '100%', maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Header banner ─────────────────────────────────────────────────── */}
      <TeacherPageHero
        eyebrow="Cohort Overview"
        title="Students"
        subtitle={`${students.length} learner${students.length !== 1 ? 's' : ''} enrolled this term`}
        rightSlot={
          <>
            <div style={{ background: 'rgba(16,185,129,0.12)', borderRadius: 10, padding: '8px 16px', border: '1px solid rgba(16,185,129,0.22)', textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#10B981', fontFamily: 'monospace', lineHeight: 1 }}>{activeCount}</div>
              <div style={{ fontSize: 9, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 2 }}>Active</div>
            </div>
            {attentionCount > 0 && (
              <div style={{ background: 'rgba(239,68,68,0.12)', borderRadius: 10, padding: '8px 16px', border: '1px solid rgba(239,68,68,0.22)', textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#F87171', fontFamily: 'monospace', lineHeight: 1 }}>{attentionCount}</div>
                <div style={{ fontSize: 9, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 2 }}>Attention</div>
              </div>
            )}
            <div style={{ background: 'rgba(167,139,250,0.12)', borderRadius: 10, padding: '8px 16px', border: '1px solid rgba(167,139,250,0.22)', textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#A78BFA', fontFamily: 'monospace', lineHeight: 1 }}>{cohortAvg}</div>
              <div style={{ fontSize: 9, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 2 }}>Avg Score</div>
            </div>
          </>
        }
      />

      <StudentList students={students} sessions={sessions} />
    </div>
  )
}
