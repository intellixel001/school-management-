import { BookOpen, PenLine, Mic2, Headphones, Calendar, Clock, Target } from 'lucide-react'
import { formatDate } from '@/lib/utils/time'
import type { Session, Student, SkillArea } from '@/types/platform'

// ── Design tokens ─────────────────────────────────────────────────────────────

const SKILL_COLORS: Record<SkillArea, string> = {
  reading:   '#6366F1',
  writing:   '#059669',
  speaking:  '#D97706',
  listening: '#3B82F6',
}

const SKILL_ICONS: Record<SkillArea, React.ComponentType<{ size?: number; style?: React.CSSProperties }>> = {
  reading:   BookOpen,
  writing:   PenLine,
  speaking:  Mic2,
  listening: Headphones,
}

const LEVEL_LABELS: Record<string, string> = {
  'entry-1': 'Entry 1',
  'entry-2': 'Entry 2',
  'entry-3': 'Entry 3',
  'level-1': 'Level 1',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function avatarInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

function scoreColor(score: number): string {
  if (score >= 75) return '#10B981'
  if (score >= 50) return '#F59E0B'
  return '#EF4444'
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m === 0) return `${s}s`
  if (s === 0) return `${m}m`
  return `${m}m ${s}s`
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  session: Session
  student: Student
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SessionContextPanel({ session, student }: Props) {
  const skillColor = SKILL_COLORS[session.skillArea]
  const SkillIcon  = SKILL_ICONS[session.skillArea]
  const sColor     = scoreColor(session.score)
  const initials   = avatarInitials(student.name)
  const accuracy   = session.questionsAttempted > 0
    ? Math.round((session.questionsCorrect / session.questionsAttempted) * 100)
    : null

  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid rgba(15,23,42,0.08)',
      borderRadius: 14,
      padding: '22px 24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
    }}>
      {/* ── Student row ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, paddingBottom: 18, borderBottom: '1px solid rgba(15,23,42,0.06)' }}>
        {/* Avatar */}
        <div style={{
          width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
          background: `linear-gradient(135deg, ${skillColor}40 0%, ${skillColor}20 100%)`,
          border: `2px solid ${skillColor}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, fontWeight: 800, color: skillColor,
        }}>
          {initials}
        </div>

        {/* Name + level */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 2 }}>
            {student.name}
          </div>
          <div style={{ fontSize: 13, color: '#6B7280' }}>
            {LEVEL_LABELS[student.level] ?? student.level}
            {student.email && ` · ${student.email}`}
          </div>
        </div>

        {/* Skill pill */}
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontSize: 12, fontWeight: 700, textTransform: 'capitalize',
          color: skillColor, background: `${skillColor}14`,
          border: `1px solid ${skillColor}28`,
          borderRadius: 20, padding: '4px 12px',
        }}>
          <SkillIcon size={12} style={{ color: skillColor }} />
          {session.skillArea}
        </span>
      </div>

      {/* ── Session stats grid ────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 14 }}>

        {/* Score */}
        <div style={{
          background: `${sColor}0A`,
          border: `1px solid ${sColor}22`,
          borderRadius: 10, padding: '12px 14px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <Target size={13} style={{ color: sColor }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Score</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: sColor, fontFamily: 'monospace', lineHeight: 1 }}>
            {session.score}
          </div>
          <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>out of 100</div>
        </div>

        {/* Accuracy */}
        {accuracy !== null && (
          <div style={{
            background: 'rgba(99,102,241,0.05)',
            border: '1px solid rgba(99,102,241,0.14)',
            borderRadius: 10, padding: '12px 14px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Accuracy</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#6366F1', fontFamily: 'monospace', lineHeight: 1 }}>
              {accuracy}%
            </div>
            <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
              {session.questionsCorrect} / {session.questionsAttempted} correct
            </div>
          </div>
        )}

        {/* Date */}
        <div style={{
          background: 'rgba(77,159,255,0.05)',
          border: '1px solid rgba(77,159,255,0.14)',
          borderRadius: 10, padding: '12px 14px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <Calendar size={13} style={{ color: '#4D9FFF' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Date</span>
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#374151', lineHeight: 1.2 }}>
            {formatDate(session.date, 'short')}
          </div>
          <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
            {new Date(session.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        {/* Duration */}
        {session.duration > 0 && (
          <div style={{
            background: 'rgba(5,150,105,0.05)',
            border: '1px solid rgba(5,150,105,0.14)',
            borderRadius: 10, padding: '12px 14px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <Clock size={13} style={{ color: '#059669' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Duration</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#059669', fontFamily: 'monospace', lineHeight: 1 }}>
              {formatDuration(session.duration)}
            </div>
            <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>session time</div>
          </div>
        )}
      </div>
    </div>
  )
}
