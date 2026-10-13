'use client'

import { Printer, TrendingUp, Award, CheckCircle2, BookOpen } from 'lucide-react'
import { useCountUp } from '@/hooks/useCountUp'

// ── Stat card ─────────────────────────────────────────────────────────────────

interface SnapshotCardProps {
  label:    string
  value:    number
  suffix?:  string
  delayMs:  number
  sub?:     string
  color:    string
  maxValue?: number
  iconNode: React.ReactNode
}

function SnapshotCard({
  label, value, suffix = '', delayMs, sub, color, maxValue, iconNode,
}: SnapshotCardProps) {
  const animated = useCountUp(value, 750)
  const pct = maxValue != null ? Math.min((animated / maxValue) * 100, 100) : null

  return (
    <div style={{
      position: 'relative', overflow: 'hidden',
      background: `linear-gradient(140deg, ${color}0D 0%, ${color}04 55%, transparent 100%)`,
      border: `1px solid ${color}2A`,
      borderRadius: 14, padding: '20px 20px 16px',
      animation: `fadeSlideUp 300ms ease-out ${delayMs}ms both`,
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Corner orb */}
      <div style={{
        position: 'absolute', right: -18, top: -18,
        width: 70, height: 70, borderRadius: '50%',
        background: `${color}06`, pointerEvents: 'none',
      }} />

      {/* Icon box */}
      <div style={{
        width: 40, height: 40, borderRadius: 11,
        background: `${color}14`, border: `1px solid ${color}22`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 14, boxShadow: `0 0 14px ${color}16`, flexShrink: 0,
      }}>
        {iconNode}
      </div>

      {/* Number */}
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 36, fontWeight: 800,
        color: 'var(--text-primary)', lineHeight: 1,
      }}>
        {animated}{suffix}
      </div>

      {/* Label */}
      <div style={{
        fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 700,
        color: 'var(--text-secondary)', marginTop: 5,
      }}>
        {label}
      </div>

      {/* Sub */}
      {sub && (
        <div style={{
          fontFamily: 'var(--font-body)', fontSize: 11,
          color: 'var(--text-muted)', marginTop: 2,
        }}>
          {sub}
        </div>
      )}

      {/* Animated progress bar */}
      {pct != null && (
        <div style={{
          marginTop: 12, height: 3, borderRadius: 2,
          background: `${color}15`, overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', borderRadius: 2,
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${color}60 0%, ${color} 100%)`,
            transition: 'width 800ms ease',
          }} />
        </div>
      )}
    </div>
  )
}

// ── CohortSnapshot ────────────────────────────────────────────────────────────

interface CohortSnapshotProps {
  avgScore:       number
  passRate:       number
  completionRate: number
  totalSessions:  number
  studentCount:   number
  asOfDate:       string
}

export function CohortSnapshot({
  avgScore, passRate, completionRate, totalSessions, studentCount, asOfDate,
}: CohortSnapshotProps) {
  function handlePrint() {
    if (typeof window !== 'undefined') window.print()
  }

  return (
    <div>
      {/* Cards grid */}
      <div
        className="snapshot-grid"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginBottom: 18 }}
      >
        <SnapshotCard
          label="Avg. Overall Score"
          value={avgScore}
          delayMs={0}
          color="#4D9FFF"
          maxValue={100}
          iconNode={<TrendingUp size={18} style={{ color: '#4D9FFF' }} />}
          sub="cohort average"
        />
        <SnapshotCard
          label="Pass Rate"
          value={passRate}
          suffix="%"
          delayMs={60}
          color="#10B981"
          maxValue={100}
          iconNode={<Award size={18} style={{ color: '#10B981' }} />}
          sub="≥ 75 average"
        />
        <SnapshotCard
          label="Completion Rate"
          value={completionRate}
          suffix="%"
          delayMs={120}
          color="#6366F1"
          maxValue={100}
          iconNode={<CheckCircle2 size={18} style={{ color: '#6366F1' }} />}
          sub="at least 1 session"
        />
        <SnapshotCard
          label="Total Sessions"
          value={totalSessions}
          delayMs={180}
          color="#D97706"
          iconNode={<BookOpen size={18} style={{ color: '#D97706' }} />}
          sub={`across ${studentCount} students`}
        />
      </div>

      {/* Footer row */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 12, flexWrap: 'wrap',
        paddingTop: 14, borderTop: '1px solid var(--border-subtle)',
      }}>
        <p style={{
          fontFamily: 'var(--font-body)', fontSize: 13,
          color: 'var(--text-muted)', margin: 0,
        }}>
          Based on {studentCount} students · {totalSessions} total sessions · as of {asOfDate}
        </p>
        <button
          type="button"
          onClick={handlePrint}
          className="print-hide"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '7px 14px',
            background: 'var(--bg-surface-2)',
            border: '1.5px solid var(--border-default)',
            borderRadius: 9, cursor: 'pointer', outline: 'none', flexShrink: 0,
            fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600,
            color: 'var(--text-secondary)',
            transition: 'border-color 150ms ease, color 150ms ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = '#4D9FFF'
            e.currentTarget.style.color       = '#4D9FFF'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--border-default)'
            e.currentTarget.style.color       = 'var(--text-secondary)'
          }}
        >
          <Printer size={13} />
          Print / Export
        </button>
      </div>
    </div>
  )
}
