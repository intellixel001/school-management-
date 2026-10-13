'use client'

import { useEffect, useState } from 'react'
import { getStudentById, getSessionsByStudentId, getStudentStats } from '@/lib/services'
import type { StudentStats } from '@/lib/services'
import { getGreeting, getRelativeTime } from '@/lib/utils/time'
import { LEVEL_LABEL, LEVEL_SHORT } from '@/lib/levelConfig'
import { Flame } from 'lucide-react'
import Link from 'next/link'
import { Spinner } from '@/components/ui'
import './student.css'
import { DashboardBackground } from './_components/DashboardBackground'
import { DashboardHero } from './_components/DashboardHero'
import { WeeklyInsightStrip } from './_components/WeeklyInsightStrip'
import { StatsRow } from './_components/StatsRow'
import { LevelCard } from './_components/LevelCard'
import { useStudentSession } from './_components/StudentSessionProvider'
import { MyMockTestsCard } from './_components/MyMockTestsCard'
import { SkillsCard } from './_components/SkillsCard'
import { RecentSessionsCard } from './_components/RecentSessionsCard'
import { JumpInCard } from './_components/JumpInCard'
import { StreakCard } from './_components/StreakCard'
import { TodaysGoalCard } from './_components/TodaysGoalCard'
import type { Student, Session } from '@/types/platform'

// ── Page ──────────────────────────────────────────────────────────────────────
export default function StudentDashboard() {
  const { session } = useStudentSession()
  const [student, setStudent] = useState<Student | null>(null)
  const [allSessions, setAllSessions] = useState<Session[]>([])
  const [stats, setStats] = useState<StudentStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!session) return
    let cancelled = false

    async function load() {
      try {
        const s = await getStudentById(session!.studentId)
        if (cancelled) return
        if (!s) { setError('Student data not found'); setIsLoading(false); return }
        const [sess, studentStats] = await Promise.all([
          getSessionsByStudentId(s.id),
          getStudentStats(s.id),
        ])
        if (cancelled) return
        setStudent(s)
        setAllSessions(sess)
        setStats(studentStats)
      } catch {
        if (!cancelled) setError('Failed to load dashboard')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [session])

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 280 }}>
        <Spinner size="lg" />
      </div>
    )
  }

  // ── Error ───────────────────────────────────────────────────────────────────
  if (error || !student) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, paddingTop: 64, textAlign: 'center' }}>
        <div style={{ fontSize: 40 }}>⚠️</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', fontFamily: 'var(--font-display)' }}>
          {error || 'Student data not found'}
        </div>
        <Link href="/student/login" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '10px 22px', borderRadius: 10,
          background: '#6366F1', color: '#FFFFFF',
          textDecoration: 'none', fontSize: 14, fontWeight: 700,
        }}>
          ← Back to Login
        </Link>
      </div>
    )
  }

  // ── Derive data ─────────────────────────────────────────────────────────────
  const doneSessions  = allSessions.filter(s => s.status === 'completed')
  const practiceSessions = doneSessions.filter(s => s.source === 'practice')
  const quizSessions = doneSessions.filter(s => s.source === 'quiz')

  const sessionsDoneCount = practiceSessions.length
  const quizzesDoneCount = quizSessions.length

  const hoursPracticed = Math.round(
    practiceSessions.reduce((sum, s) => sum + (s.duration ?? 0), 0) / 3600
  )

  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const sessionsToday = doneSessions.filter(
    s => new Date(s.date).getTime() >= startOfToday.getTime()
  ).length

  const firstName  = student.name.split(' ')[0]

  return (
    <div className="s-dashboard-route" style={{ position: 'relative', width: '100%', maxWidth: 1160, margin: '0 auto' }}>
      <DashboardBackground />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>

        <div
          className="dashboard-top-row grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px]"
          style={{
            gap: 20,
            alignItems: 'stretch',
          }}
        >
          <DashboardHero student={student} firstName={firstName} />
          <LevelCard student={student} />
        </div>

        <WeeklyInsightStrip studentId={student.id} />

        <StatsRow 
          sessions={sessionsDoneCount}
          points={student.totalPoints}
          hours={hoursPracticed}
          quizzes={quizzesDoneCount}
        />

        {/* ── Main Grid ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_356px]" style={{ gap:20, alignItems:'start' }}>

        {/* Left column */}
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          <SkillsCard student={student} />
          <RecentSessionsCard sessions={practiceSessions} />
          <MyMockTestsCard studentId={student.id} />
        </div>

        {/* Right column */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <JumpInCard />
          <TodaysGoalCard sessionsToday={sessionsToday} />
          <StreakCard student={student} sessions={allSessions} />
        </div>
      </div>
      </div>
    </div>
  )
}
