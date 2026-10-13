import { SKILL_CONFIG } from '@/lib/skillConfig'
import { formatDate, getRelativeTime } from '@/lib/utils/time'
import type { Session, SkillArea } from '@/types/platform'

const SKILL_PAL: Record<SkillArea, { color: string; bg: string }> = {
  reading:   { color: '#6366F1', bg: 'rgba(99,102,241,0.09)'  },
  writing:   { color: '#10B981', bg: 'rgba(16,185,129,0.09)'  },
  speaking:  { color: '#F59E0B', bg: 'rgba(245,158,11,0.09)'  },
  listening: { color: '#EC4899', bg: 'rgba(236,72,153,0.09)'  },
}

function scoreColor(s: number) {
  return s >= 75 ? '#10B981' : s >= 50 ? '#F59E0B' : '#EF4444'
}
function scoreBg(s: number) {
  return s >= 75 ? 'rgba(16,185,129,0.10)' : s >= 50 ? 'rgba(245,158,11,0.10)' : 'rgba(239,68,68,0.10)'
}

interface Props { sessions: Session[] }

export function RecentSessionsList({ sessions }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {sessions.map((session, idx) => {
        const cfg  = SKILL_CONFIG[session.skillArea]
        const pal  = SKILL_PAL[session.skillArea]
        const Icon = cfg.icon

        return (
          <div
            key={session.id}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 14px', borderRadius: 12,
              background: '#FAFBFF',
              border: '1px solid rgba(0,0,0,0.06)',
              borderLeft: `3px solid ${pal.color}`,
              animation: `fadeSlideUp 260ms ease-out ${idx * 50}ms both`,
            }}
          >
            {/* Icon */}
            <div style={{
              width: 38, height: 38, borderRadius: 11, flexShrink: 0,
              background: pal.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon size={17} color={pal.color} strokeWidth={2.2} />
            </div>

            {/* Label + date */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>
                {cfg.label} Practice
              </div>
              <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 1 }}>
                {getRelativeTime(session.date)} · {Math.round(session.duration / 60)} min
              </div>
            </div>

            {/* Correct count */}
            <div style={{ fontSize: 12, color: '#94A3B8', flexShrink: 0 }} className="hidden sm:block">
              {session.questionsCorrect}/{session.questionsAttempted} correct
            </div>

            {/* Score badge */}
            <div style={{
              fontSize: 14, fontWeight: 800, padding: '4px 12px',
              borderRadius: 8, flexShrink: 0,
              color: scoreColor(session.score),
              background: scoreBg(session.score),
              fontFamily: 'var(--font-mono)',
            }}>
              {session.score}
            </div>
          </div>
        )
      })}
    </div>
  )
}
