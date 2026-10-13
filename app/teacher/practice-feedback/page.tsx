export const dynamic = 'force-dynamic'

import { getPendingPracticeFeedback, getStudents } from '@/lib/services'
import { PracticeFeedbackQueueList } from './_components/PracticeFeedbackQueueList'
import type { Metadata } from 'next'
import type { SkillArea } from '@/types/platform'

// ── Design tokens ─────────────────────────────────────────────────────────────

const SKILL_COLORS: Record<SkillArea, string> = {
  reading:   '#6366F1',
  writing:   '#059669',
  speaking:  '#D97706',
  listening: '#3B82F6',
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: 'Practice Feedback — English AI Tutor',
  description: 'Review and give feedback on completed practice sessions.',
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function PracticeFeedbackQueuePage() {
  const [sessions, students] = await Promise.all([
    getPendingPracticeFeedback(),
    getStudents(),
  ])

  const studentById = new Map(students.map(s => [s.id, s]))

  // Skill breakdown for hero stat
  const skillCounts = sessions.reduce<Record<string, number>>((acc, s) => {
    acc[s.skillArea] = (acc[s.skillArea] ?? 0) + 1
    return acc
  }, {})

  return (
    <div style={{ width: '100%', maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Dark hero banner (EXACT copy of feedback/page.tsx hero pattern) ──── */}
      <div style={{
        background: 'linear-gradient(135deg, #0A1628 0%, #0E2444 55%, #12305C 100%)',
        borderRadius: 14, padding: '24px 28px',
        border: '1px solid rgba(77,159,255,0.14)',
        overflow: 'hidden', position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20,
      }}>
        {/* Circle decorations — identical positions to feedback/page.tsx */}
        <div style={{ position: 'absolute', right: 140, top: -50, width: 180, height: 180, borderRadius: '50%', background: 'rgba(77,159,255,0.05)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', right: 20, bottom: -30, width: 110, height: 110, borderRadius: '50%', background: 'rgba(99,102,241,0.04)', pointerEvents: 'none' }} />

        {/* Text block */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            fontSize: 10, color: '#4D9FFF', fontWeight: 700,
            letterSpacing: '1px', textTransform: 'uppercase',
            marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4D9FFF', boxShadow: '0 0 6px #4D9FFF' }} />
            Practice Feedback
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#F1F5F9', margin: 0 }}>
            Sessions awaiting your feedback
          </h1>
          <p style={{ fontSize: 13, color: '#94A3B8', margin: '4px 0 0' }}>
            {sessions.length === 0
              ? 'All caught up — no sessions waiting.'
              : `${sessions.length} session${sessions.length !== 1 ? 's' : ''} completed without feedback`}
          </p>
        </div>

        {/* Right-side stat pills */}
        <div className="hidden sm:flex" style={{ gap: 10, flexShrink: 0, position: 'relative', zIndex: 1, alignItems: 'center' }}>
          {/* Total pending */}
          {sessions.length > 0 && (
            <div style={{
              background: 'rgba(239,68,68,0.12)', borderRadius: 10,
              padding: '8px 18px', border: '1px solid rgba(239,68,68,0.28)', textAlign: 'center',
            }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#F87171', fontFamily: 'monospace', lineHeight: 1 }}>
                {sessions.length}
              </div>
              <div style={{ fontSize: 9, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 2 }}>
                Pending
              </div>
            </div>
          )}

          {/* Skill breakdown pills */}
          {Object.entries(skillCounts).slice(0, 3).map(([skill, count]) => (
            <div key={skill} style={{
              background: `${SKILL_COLORS[skill as SkillArea]}12`, borderRadius: 10,
              padding: '8px 14px', border: `1px solid ${SKILL_COLORS[skill as SkillArea]}28`, textAlign: 'center',
            }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: SKILL_COLORS[skill as SkillArea], fontFamily: 'monospace', lineHeight: 1 }}>
                {count}
              </div>
              <div style={{ fontSize: 9, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 2 }}>
                {skill}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Queue list ───────────────────────────────────────────────────────── */}
      <PracticeFeedbackQueueList sessions={sessions} studentById={studentById} />

    </div>
  )
}
