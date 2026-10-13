'use client'

import { Users, AlertCircle, ClipboardCheck, PenSquare } from 'lucide-react'
import { useCountUp } from '@/hooks/useCountUp'

// ── Internal card ─────────────────────────────────────────────────────────────

function StatCard({
  value,
  label,
  icon: Icon,
  color,
  delta,
  delay,
}: {
  value: number
  label: string
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>
  color: string
  delta: React.ReactNode
  delay: number
}) {
  const animated = useCountUp(value, 750)

  return (
    <div
      className="animate-[fadeSlideUp_350ms_ease-out_both]"
      style={{
        position: 'relative', overflow: 'hidden',
        background: `linear-gradient(140deg, ${color}1A 0%, ${color}0A 55%, transparent 100%)`,
        border: `2px solid ${color}40`,
        borderRadius: 14,
        padding: '20px 20px 18px',
        animationDelay: `${delay}ms`,
      }}
    >
      {/* Corner glow orb */}
      <div style={{
        position: 'absolute', top: -28, right: -28,
        width: 96, height: 96, borderRadius: '50%',
        background: `${color}0C`, pointerEvents: 'none',
      }} />

      {/* Icon container */}
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: `linear-gradient(135deg, ${color}28 0%, ${color}14 100%)`,
        border: `1px solid ${color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 18,
        boxShadow: `0 4px 14px ${color}1E`,
      }}>
        <Icon size={19} style={{ color }} />
      </div>

      {/* Number */}
      <div style={{
        fontSize: 40, fontWeight: 900, color: '#0F172A',
        fontFamily: 'var(--font-mono, monospace)',
        lineHeight: 1, letterSpacing: '-1.5px',
      }}>
        {animated}
      </div>

      {/* Label */}
      <div style={{
        fontSize: 11, fontWeight: 800, color: '#334155',
        marginTop: 5, textTransform: 'uppercase', letterSpacing: '0.6px',
      }}>
        {label}
      </div>

      {/* Delta / trend */}
      <div style={{ fontSize: 12, fontWeight: 600, marginTop: 9, display: 'flex', alignItems: 'center', gap: 4 }}>
        {delta}
      </div>
    </div>
  )
}

// ── Exported grid ─────────────────────────────────────────────────────────────

interface StatGridProps {
  totalStudents: number
  needAttention: number
  pendingReviews: number
  pendingPracticeFeedback: number
}

export function StatGrid({ totalStudents, needAttention, pendingReviews, pendingPracticeFeedback }: StatGridProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        value={totalStudents}
        label="Total Students"
        icon={Users}
        color="#4D9FFF"
        delay={0}
        delta={<span style={{ color: '#4D9FFF' }}>Enrolled this term</span>}
      />
      <StatCard
        value={needAttention}
        label="Need Attention"
        icon={AlertCircle}
        color={needAttention > 0 ? '#EF4444' : '#4D9FFF'}
        delay={80}
        delta={
          needAttention > 0
            ? <span style={{ color: '#EF4444' }}>↑ {needAttention} flagged</span>
            : <span style={{ color: '#4D9FFF' }}>All students on track</span>
        }
      />
      <StatCard
        value={pendingReviews}
        label="Pending Reviews"
        icon={ClipboardCheck}
        color={pendingReviews > 0 ? '#F59E0B' : '#4D9FFF'}
        delay={160}
        delta={
          pendingReviews > 0
            ? <span style={{ color: '#F59E0B' }}>Awaiting your review</span>
            : <span style={{ color: '#4D9FFF' }}>All clear</span>
        }
      />
      <StatCard
        value={pendingPracticeFeedback}
        label="Pending Feedback"
        icon={PenSquare}
        color={pendingPracticeFeedback > 0 ? '#F59E0B' : '#4D9FFF'}
        delay={240}
        delta={
          pendingPracticeFeedback > 0
            ? <span style={{ color: '#F59E0B' }}>Practice sessions waiting</span>
            : <span style={{ color: '#4D9FFF' }}>All feedback given</span>
        }
      />
    </div>
  )
}
