'use client'

import { useEffect, useState } from 'react'
import { getStudentById, getSessionsByStudentId } from '@/lib/services'
import { SKILL_ORDER } from '@/lib/skillConfig'
import { SkillScoreCards }    from './_components/SkillScoreCards'
import { SkillTrendChart }    from './_components/SkillTrendChart'
import { StreakCalendar }     from './_components/StreakCalendar'
import { RecentSessionsList } from './_components/RecentSessionsList'
import { Flame, Calendar, BarChart2, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Spinner } from '@/components/ui'
import { useStudentSession } from '../_components/StudentSessionProvider'
import type { Student, Session } from '@/types/platform'

// ── Big overview ring ─────────────────────────────────────────────────────────
function OverviewRing({ pct }: { pct: number }) {
  const r     = 54
  const circ  = 2 * Math.PI * r
  const dash  = (pct / 100) * circ
  return (
    <svg width={136} height={136} viewBox="0 0 136 136" style={{ flexShrink: 0 }}>
      <circle cx={68} cy={68} r={r} fill="rgba(255,255,255,0.07)" />
      <circle cx={68} cy={68} r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={9} />
      <circle
        cx={68} cy={68} r={r} fill="none"
        stroke="#FFFFFF" strokeWidth={9}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 68 68)"
      />
      <text x={68} y={62} textAnchor="middle" fontSize={28} fontWeight={900}
        fill="#FFFFFF" fontFamily="monospace">{pct}</text>
      <text x={68} y={80} textAnchor="middle" fontSize={11}
        fill="rgba(255,255,255,0.60)" fontFamily="sans-serif">avg score</text>
    </svg>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ProgressPage() {
  const { session } = useStudentSession()
  const [student, setStudent]       = useState<Student | null>(null)
  const [allSessions, setAllSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading]   = useState(true)
  const [error, setError]           = useState<string | null>(null)

  useEffect(() => {
    if (!session) return
    let cancelled = false

    async function load() {
      try {
        const s = await getStudentById(session!.studentId)
        if (cancelled) return
        if (!s) { setError('Student data not found'); setIsLoading(false); return }
        const sess = await getSessionsByStudentId(s.id)
        if (cancelled) return
        setStudent(s)
        setAllSessions(sess)
      } catch {
        if (!cancelled) setError('Failed to load progress data')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [session])

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 280 }}>
        <Spinner size="lg" />
      </div>
    )
  }

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
  const doneSessions = allSessions
    .filter(s => s.status === 'completed')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  
  const practiceSessions = doneSessions.filter(s => s.source === 'practice')
  const recentSessions = practiceSessions.slice(0, 5)

  const avgScore = Math.round(
    (student.skills.reading + student.skills.writing +
     student.skills.speaking + student.skills.listening) / 4
  )
  const firstName  = student.name.split(' ')[0]

  const motivation = avgScore >= 75
    ? `Excellent progress, ${firstName}!`
    : avgScore >= 55
    ? `Great work, ${firstName} — keep going!`
    : `Stay consistent, ${firstName} — you're improving!`

  return (
    <div style={{ width: '100%', maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Hero overview banner ── */}
      <div style={{
        background: 'linear-gradient(135deg, #312E81 0%, #4F46E5 45%, #2563EB 100%)',
        borderRadius: 20, padding: '28px 28px',
        display: 'flex', alignItems: 'center', gap: 24,
        position: 'relative', overflow: 'hidden',
        flexWrap: 'wrap',
      }}>
        {/* Decorative circles */}
        <div style={{ position:'absolute', top:-40, right:-40, width:200, height:200, borderRadius:'50%', background:'rgba(255,255,255,0.04)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:-30, left:'40%', width:160, height:160, borderRadius:'50%', background:'rgba(255,255,255,0.03)', pointerEvents:'none' }} />

        <OverviewRing pct={avgScore} />

        <div style={{ flex: 1, minWidth: 200, position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(255,255,255,0.14)', borderRadius: 20,
            padding: '4px 12px', marginBottom: 10,
            fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.85)',
          }}>
            My Progress
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#FFFFFF', marginBottom: 4, fontFamily: 'var(--font-display)' }}>
            {motivation}
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.60)', marginBottom: 18 }}>
            Average across all four skill areas
          </div>

          {/* Stats chips */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {[
              { icon: <Flame size={13} />,    label: `${student.streak} day streak` },
              { icon: <BarChart2 size={13} />, label: `${practiceSessions.length} sessions` },
            ].map((chip, i) => (
              <div key={i} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'rgba(255,255,255,0.14)', borderRadius: 20,
                padding: '5px 12px', fontSize: 12, fontWeight: 600,
                color: '#FFFFFF', backdropFilter: 'blur(4px)',
              }}>
                {chip.icon} {chip.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Skill score cards ── */}
      <SkillScoreCards skills={student.skills} sessions={doneSessions} />

      {/* ── Trend charts + Activity calendar ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px]" style={{ gap: 20, alignItems: 'start' }}>

        {/* Trend charts 2×2 */}
        <div style={{
          background: '#FFFFFF', borderRadius: 16,
          border: '1px solid rgba(0,0,0,0.07)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
          padding: '20px 22px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#0F172A', fontFamily: 'var(--font-display)' }}>
              Skill Trends
            </h2>
            <span style={{ fontSize: 12, color: '#94A3B8' }}>Last 5 sessions per skill</span>
          </div>
          <div className="grid grid-cols-2" style={{ gap: 18 }}>
            {SKILL_ORDER.map(skill => (
              <SkillTrendChart
                key={skill}
                skill={skill}
                sessions={practiceSessions.filter(s => s.studentId === student.id)}
                currentScore={student.skills[skill]}
              />
            ))}
          </div>
        </div>

        {/* Activity calendar + streak */}
        <div style={{
          background: '#FFFFFF', borderRadius: 16,
          border: '1px solid rgba(0,0,0,0.07)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
          padding: '20px 22px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#0F172A', fontFamily: 'var(--font-display)' }}>
              Activity
            </h2>
            <span style={{ fontSize: 12, color: '#94A3B8' }}>Last 28 days</span>
          </div>
          <StreakCalendar sessions={doneSessions} />
          <div style={{
            marginTop: 16, paddingTop: 14, borderTop: '1px solid #F1F5F9',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(249,115,22,0.10)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F97316'
            }}>
              <Flame size={20} strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#F97316', fontFamily: 'var(--font-mono)' }}>
                {student.streak} <span style={{ fontSize: 12, fontWeight: 500, color: '#94A3B8' }}>day streak</span>
              </div>
              <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 1 }}>
                {student.streak > 0 ? 'Keep the momentum going!' : 'Start your streak today!'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Recent sessions ── */}
      <div style={{
        background: '#FFFFFF', borderRadius: 16,
        border: '1px solid rgba(0,0,0,0.07)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        padding: '20px 22px', paddingBottom: 32,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#0F172A', fontFamily: 'var(--font-display)' }}>
            Recent Sessions
          </h2>
          <Link href="/student/results" style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: 13, color: '#6366F1', textDecoration: 'none', fontWeight: 600,
          }}>
            View all <ArrowRight size={13} />
          </Link>
        </div>
        {recentSessions.length > 0
          ? <RecentSessionsList sessions={recentSessions} />
          : (
            <div style={{ textAlign: 'center', padding: '24px 0', color: '#94A3B8', fontSize: 14 }}>
              Your practice sessions from the classroom kiosk will appear here.
            </div>
          )
        }
      </div>
    </div>
  )
}
