export const dynamic = 'force-dynamic'

import { getReviewHistory } from '@/lib/services'
import { SKILL_CONFIG } from '@/lib/skillConfig'
import { TeacherPageHero } from '../_components/TeacherPageHero'
import { FeedbackTable } from './_components/FeedbackTable'
import Link from 'next/link'
import { FileText, BookOpen, ClipboardList } from 'lucide-react'
import type { Metadata } from 'next'
import type { SkillArea } from '@/types/platform'

export const metadata: Metadata = {
  title: 'Review History — English AI Tutor',
  description: 'Complete feedback history across all students.',
}

const SKILL_COLORS: Record<SkillArea, string> = {
  reading:   '#6366F1',
  writing:   '#059669',
  speaking:  '#D97706',
  listening: '#3B82F6',
}

export default async function FeedbackReportsPage() {
  const allItems = await getReviewHistory()

  const totalCount    = allItems.length
  const practiceCount = allItems.filter(i => i.source === 'practice').length
  const mockCount     = allItems.filter(i => i.source === 'mock').length

  const skillCounts = allItems.reduce<Record<string, number>>((acc, item) => {
    acc[item.skillArea] = (acc[item.skillArea] ?? 0) + 1
    return acc
  }, {})
  const topSkill      = (Object.entries(skillCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'writing') as SkillArea
  const topSkillCfg   = SKILL_CONFIG[topSkill]
  const TopSkillIcon  = topSkillCfg.icon
  const topSkillColor = SKILL_COLORS[topSkill]

  return (
    <div style={{ width: '100%', maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Header banner ─────────────────────────────────────────────────── */}
      <TeacherPageHero
        eyebrow="Review History"
        title="Feedback History"
        subtitle={`${totalCount} reviewed item${totalCount !== 1 ? 's' : ''} across all students`}
        rightSlot={
          <Link
            href="/teacher/review"
            style={{
              fontSize: 12, fontWeight: 600, color: '#FFFFFF',
              textDecoration: 'none',
              background: 'linear-gradient(135deg, #4D9FFF 0%, #0066CC 100%)',
              borderRadius: 8, padding: '9px 18px',
              boxShadow: '0 4px 14px rgba(0,102,204,0.30)',
              whiteSpace: 'nowrap',
            }}
          >
            Mock Review Queue →
          </Link>
        }
      />

      {/* ── Premium stat cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4" style={{ gap: 14 }}>

        {/* Total Reviewed */}
        <div style={{
          position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(140deg, rgba(77,159,255,0.08) 0%, rgba(77,159,255,0.03) 55%, transparent 100%)',
          border: '1px solid rgba(77,159,255,0.18)',
          borderRadius: 14, padding: '20px 20px 18px',
        }}>
          <div style={{ position: 'absolute', right: -16, top: -16, width: 64, height: 64, borderRadius: '50%', background: 'rgba(77,159,255,0.06)', pointerEvents: 'none' }} />
          <div style={{ width: 40, height: 40, borderRadius: 11, background: 'rgba(77,159,255,0.14)', border: '1px solid rgba(77,159,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
            <FileText size={18} style={{ color: '#4D9FFF' }} />
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#4D9FFF', lineHeight: 1, fontFamily: 'var(--font-mono)' }}>{totalCount}</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginTop: 5 }}>Total Reviews</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>all time</div>
        </div>

        {/* Practice Sessions */}
        <div style={{
          position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(140deg, rgba(99,102,241,0.08) 0%, rgba(99,102,241,0.03) 55%, transparent 100%)',
          border: '1px solid rgba(99,102,241,0.20)',
          borderRadius: 14, padding: '20px 20px 18px',
        }}>
          <div style={{ position: 'absolute', right: -16, top: -16, width: 64, height: 64, borderRadius: '50%', background: 'rgba(99,102,241,0.06)', pointerEvents: 'none' }} />
          <div style={{ width: 40, height: 40, borderRadius: 11, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
            <BookOpen size={18} style={{ color: '#6366F1' }} />
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#6366F1', lineHeight: 1, fontFamily: 'var(--font-mono)' }}>{practiceCount}</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginTop: 5 }}>Practice Reviews</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>with teacher feedback</div>
        </div>

        {/* Mock Reviews */}
        <div style={{
          position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(140deg, rgba(0,102,204,0.08) 0%, rgba(0,102,204,0.03) 55%, transparent 100%)',
          border: '1px solid rgba(0,102,204,0.20)',
          borderRadius: 14, padding: '20px 20px 18px',
        }}>
          <div style={{ position: 'absolute', right: -16, top: -16, width: 64, height: 64, borderRadius: '50%', background: 'rgba(0,102,204,0.06)', pointerEvents: 'none' }} />
          <div style={{ width: 40, height: 40, borderRadius: 11, background: 'rgba(0,102,204,0.12)', border: '1px solid rgba(0,102,204,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
            <ClipboardList size={18} style={{ color: '#0066CC' }} />
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#0066CC', lineHeight: 1, fontFamily: 'var(--font-mono)' }}>{mockCount}</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginTop: 5 }}>Mock Reviews</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>published to students</div>
        </div>

        {/* Top Skill Area */}
        <div style={{
          position: 'relative', overflow: 'hidden',
          background: `linear-gradient(140deg, ${topSkillColor}0D 0%, ${topSkillColor}04 55%, transparent 100%)`,
          border: `1px solid ${topSkillColor}2A`,
          borderRadius: 14, padding: '20px 20px 18px',
        }}>
          <div style={{ position: 'absolute', right: -16, top: -16, width: 64, height: 64, borderRadius: '50%', background: `${topSkillColor}08`, pointerEvents: 'none' }} />
          <div style={{ width: 40, height: 40, borderRadius: 11, background: `${topSkillColor}18`, border: `1px solid ${topSkillColor}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, boxShadow: `0 0 14px ${topSkillColor}18` }}>
            <TopSkillIcon size={18} style={{ color: topSkillColor }} />
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: topSkillColor, lineHeight: 1, textTransform: 'capitalize' }}>{topSkill}</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginTop: 5 }}>Top Skill Area</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{skillCounts[topSkill] ?? 0} reviews</div>
        </div>

      </div>

      {/* ── Interactive table ─────────────────────────────────────────────────── */}
      <FeedbackTable items={allItems} />

    </div>
  )
}
