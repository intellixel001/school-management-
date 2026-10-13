'use client'

import { useState } from 'react'
import {
  BookOpen, PenLine, Mic2, Headphones,
  LayoutGrid, MessageSquare, Clock, CheckCircle2,
  TrendingUp, ClipboardList
} from 'lucide-react'
import { SKILL_CONFIG, SKILL_ORDER } from '@/lib/skillConfig'
import { formatDate, getRelativeTime } from '@/lib/utils/time'
import type { Session, SkillArea } from '@/types/platform'

// ── Colour palette per skill ──────────────────────────────────────────────────
const SKILL_PAL: Record<SkillArea, { color: string; bg: string; bar: string; border: string }> = {
  reading:   { color:'#6366F1', bg:'rgba(99,102,241,0.09)',  bar:'linear-gradient(90deg,#6366F1,#818CF8)', border:'rgba(99,102,241,0.20)' },
  writing:   { color:'#10B981', bg:'rgba(16,185,129,0.09)',  bar:'linear-gradient(90deg,#10B981,#34D399)', border:'rgba(16,185,129,0.20)' },
  speaking:  { color:'#F59E0B', bg:'rgba(245,158,11,0.09)',  bar:'linear-gradient(90deg,#F59E0B,#FCD34D)', border:'rgba(245,158,11,0.20)' },
  listening: { color:'#EC4899', bg:'rgba(236,72,153,0.09)',  bar:'linear-gradient(90deg,#EC4899,#F472B6)', border:'rgba(236,72,153,0.20)' },
}

// ── Skill filter tab config ───────────────────────────────────────────────────
const SKILL_TABS = [
  { id: 'all'       as const, label: 'All',       Icon: LayoutGrid, color:'#6366F1', bg:'rgba(99,102,241,0.09)'  },
  { id: 'reading'   as const, label: 'Reading',   Icon: BookOpen,   color:'#6366F1', bg:'rgba(99,102,241,0.09)'  },
  { id: 'writing'   as const, label: 'Writing',   Icon: PenLine,    color:'#10B981', bg:'rgba(16,185,129,0.09)'  },
  { id: 'speaking'  as const, label: 'Speaking',  Icon: Mic2,       color:'#F59E0B', bg:'rgba(245,158,11,0.09)'  },
  { id: 'listening' as const, label: 'Listening', Icon: Headphones, color:'#EC4899', bg:'rgba(236,72,153,0.09)'  },
]

type FeedbackFilter = 'all' | 'with-feedback' | 'needs-review'
type SkillFilter    = SkillArea | 'all'

// ── Score helpers ─────────────────────────────────────────────────────────────
function scoreColor(s: number) {
  return s >= 75 ? '#10B981' : s >= 50 ? '#F59E0B' : '#EF4444'
}
function scoreBg(s: number) {
  return s >= 75 ? 'rgba(16,185,129,0.10)' : s >= 50 ? 'rgba(245,158,11,0.10)' : 'rgba(239,68,68,0.10)'
}
function passLabel(s: number): { text: string; color: string; bg: string } {
  return s >= 75
    ? { text: 'Pass',       color:'#15803D', bg:'rgba(16,185,129,0.12)' }
    : s >= 50
    ? { text: 'Borderline', color:'#92400E', bg:'rgba(245,158,11,0.12)' }
    : { text: 'Not yet',    color:'#B91C1C', bg:'rgba(239,68,68,0.10)'  }
}

// ── Main component ────────────────────────────────────────────────────────────
interface Props { sessions: Session[] }

export function ResultsList({ sessions }: Props) {
  const [skillFilter,    setSkillFilter]    = useState<SkillFilter>('all')
  const [feedbackFilter, setFeedbackFilter] = useState<FeedbackFilter>('all')

  // ── Summary stats (always over full set) ────────────────────────────────────
  const totalSessions  = sessions.length
  const avgScore       = totalSessions > 0
    ? Math.round(sessions.reduce((a, s) => a + s.score, 0) / totalSessions) : 0
  const withFeedback   = sessions.filter(s => s.teacherFeedback).length

  // Best skill by avg score
  const skillAvgs = SKILL_ORDER.map(sk => {
    const skSessions = sessions.filter(s => s.skillArea === sk)
    const avg = skSessions.length > 0
      ? Math.round(skSessions.reduce((a,s) => a+s.score,0) / skSessions.length) : 0
    return { sk, avg, count: skSessions.length }
  }).filter(x => x.count > 0)
  const bestSkill = [...skillAvgs].sort((a,b) => b.avg - a.avg)[0]

  // ── Filtered sessions ────────────────────────────────────────────────────────
  const filtered = sessions.filter(s => {
    if (skillFilter    !== 'all' && s.skillArea !== skillFilter)      return false
    if (feedbackFilter === 'with-feedback' && !s.teacherFeedback)     return false
    if (feedbackFilter === 'needs-review'  && s.score >= 50)          return false
    return true
  })

  return (
    <div>

      {/* ── Summary stats row ── */}
      <div className="grid grid-cols-3" style={{ gap:12, marginBottom:24 }}>
        {[
          { icon:<ClipboardList size={19} color="#6366F1" />, label:'Sessions',       value:String(totalSessions),    color:'#6366F1', bg:'rgba(99,102,241,0.07)',  border:'rgba(99,102,241,0.15)' },
          { icon:<TrendingUp size={19} color={scoreColor(avgScore)} />, label:'Avg. Score',      value:String(avgScore),         color: scoreColor(avgScore), bg: scoreBg(avgScore), border:`${scoreColor(avgScore)}33` },
          { icon:<MessageSquare size={19} color="#F59E0B" />, label:'With Feedback',  value:String(withFeedback),     color:'#F59E0B', bg:'rgba(245,158,11,0.07)', border:'rgba(245,158,11,0.15)' },
        ].map((stat, i) => (
          <div key={i} style={{
            background:'#FFFFFF', borderRadius:14,
            padding:'14px 16px',
            border:`1px solid ${stat.border}`,
            boxShadow:'0 1px 3px rgba(0,0,0,0.05)',
            display:'flex', flexDirection:'column', gap:8,
          }}>
            <div style={{
              width:36, height:36, borderRadius:10,
              background:stat.bg, fontSize:17,
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              {stat.icon}
            </div>
            <div>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:22, fontWeight:800, color:stat.color, lineHeight:1 }}>
                {stat.value}
              </div>
              <div style={{ fontSize:11, color:'#94A3B8', fontWeight:500, marginTop:3 }}>
                {stat.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Best skill banner */}
      {bestSkill && (
        <div style={{
          display:'flex', alignItems:'center', gap:10,
          background: SKILL_PAL[bestSkill.sk as SkillArea].bg,
          border:`1px solid ${SKILL_PAL[bestSkill.sk as SkillArea].border}`,
          borderRadius:12, padding:'10px 16px', marginBottom:20,
        }}>
          <TrendingUp size={16} color={SKILL_PAL[bestSkill.sk as SkillArea].color} />
          <span style={{ fontSize:13, fontWeight:600, color:'#0F172A' }}>
            Best skill: <span style={{ color: SKILL_PAL[bestSkill.sk as SkillArea].color }}>
              {SKILL_CONFIG[bestSkill.sk as SkillArea].label}
            </span>
          </span>
          <span style={{
            marginLeft:'auto', fontSize:12, fontWeight:700,
            color: SKILL_PAL[bestSkill.sk as SkillArea].color,
            background:'#FFFFFF', borderRadius:6, padding:'2px 8px',
          }}>
            Avg {bestSkill.avg}/100
          </span>
        </div>
      )}

      {/* ── Skill filter tabs ── */}
      <div style={{
        display:'flex', gap:8, flexWrap:'wrap', marginBottom:12,
        overflowX:'auto', paddingTop:4, paddingBottom:4,
      }}>
        {SKILL_TABS.map(tab => {
          const isActive = skillFilter === tab.id
          return (
            <button
              key={tab.id} type="button"
              onClick={() => setSkillFilter(tab.id)}
              style={{
                display:'inline-flex', alignItems:'center', gap:6,
                padding:'7px 14px', borderRadius:10, flexShrink:0,
                border:`1.5px solid ${isActive ? tab.color + '55' : 'rgba(0,0,0,0.08)'}`,
                background: isActive ? tab.bg : '#FFFFFF',
                color: isActive ? tab.color : '#64748B',
                fontFamily:'var(--font-body)', fontSize:13,
                fontWeight: isActive ? 700 : 500,
                cursor:'pointer', outline:'none',
                transition:'all 150ms ease',
                transform: isActive ? 'translateY(-1px)' : 'none',
                boxShadow: isActive ? `0 2px 8px ${tab.color}22` : 'none',
              }}
            >
              <tab.Icon size={13} strokeWidth={isActive ? 2.5 : 1.8} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* ── Feedback filter chips ── */}
      <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
        {([
          { id:'all'           as FeedbackFilter, label:'All sessions'    },
          { id:'with-feedback' as FeedbackFilter, label:'Has feedback' },
          { id:'needs-review'  as FeedbackFilter, label:'Needs review' },
        ]).map(chip => {
          const active = feedbackFilter === chip.id
          return (
            <button
              key={chip.id} type="button"
              onClick={() => setFeedbackFilter(chip.id)}
              style={{
                padding:'5px 12px', borderRadius:20,
                border:`1px solid ${active ? '#6366F1' : 'rgba(0,0,0,0.09)'}`,
                background: active ? 'rgba(99,102,241,0.08)' : '#FFFFFF',
                color: active ? '#6366F1' : '#64748B',
                fontFamily:'var(--font-body)', fontSize:12,
                fontWeight: active ? 700 : 500,
                cursor:'pointer', outline:'none',
                transition:'all 140ms ease',
              }}
            >
              {chip.label}
            </button>
          )
        })}

        {/* Count badge */}
        <span style={{
          marginLeft:'auto', fontSize:12, color:'#94A3B8',
          fontWeight:500, alignSelf:'center',
        }}>
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Session cards ── */}
      {filtered.length === 0 ? (
        <EmptyState feedbackFilter={feedbackFilter} />
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:14, paddingBottom:32 }}>
          {filtered.map((session, idx) => (
            <ResultCard key={session.id} session={session} delay={idx * 45} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Individual result card ────────────────────────────────────────────────────
function ResultCard({ session, delay }: { session: Session; delay: number }) {
  const cfg  = SKILL_CONFIG[session.skillArea]
  const pal  = SKILL_PAL[session.skillArea]
  const Icon = cfg.icon
  const pass = passLabel(session.score)
  const accuracy = session.questionsAttempted > 0
    ? Math.round((session.questionsCorrect / session.questionsAttempted) * 100) : 0

  return (
    <div
      style={{
        background:'#FFFFFF', borderRadius:16,
        border:'1px solid rgba(0,0,0,0.07)',
        boxShadow:'0 1px 4px rgba(0,0,0,0.05)',
        overflow:'hidden',
        animation:`fadeSlideUp 280ms ease-out ${delay}ms both`,
        borderLeft:`4px solid ${pal.color}`,
        transition:'box-shadow 150ms ease, transform 150ms ease',
      }}
    >

      {/* ── Top row ── */}
      <div style={{
        display:'flex', alignItems:'flex-start',
        justifyContent:'space-between', gap:14,
        padding:'16px 18px 12px',
        flexWrap:'wrap',
      }}>
        {/* Left: icon + info */}
        <div style={{ display:'flex', alignItems:'center', gap:12, minWidth:0 }}>
          <div style={{
            width:42, height:42, borderRadius:12, flexShrink:0,
            background:pal.bg,
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <Icon size={19} color={pal.color} strokeWidth={2.2} />
          </div>
          <div>
            <div style={{
              fontFamily:'var(--font-display)', fontSize:15, fontWeight:700,
              color:'#0F172A', marginBottom:3,
            }}>
              {cfg.label} Practice
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
              <span style={{ fontSize:12, color:'#94A3B8' }}>
                {getRelativeTime(session.date)}
              </span>
              <span style={{ fontSize:10, color:'#CBD5E1' }}>·</span>
              <span style={{ fontSize:12, color:'#94A3B8' }}>
                {formatDate(session.date, 'short')}
              </span>
              <span style={{ fontSize:10, color:'#CBD5E1' }}>·</span>
              <span style={{ fontSize:12, color:'#94A3B8' }}>
                {Math.round(session.duration / 60)} min
              </span>
            </div>
          </div>
        </div>

        {/* Right: score + pass badge */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:5, flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'baseline', gap:3 }}>
            <span style={{
              fontFamily:'var(--font-mono)', fontSize:28, fontWeight:900,
              color:scoreColor(session.score), lineHeight:1,
            }}>
              {session.score}
            </span>
            <span style={{ fontSize:12, color:'#CBD5E1', fontWeight:500 }}>/100</span>
          </div>
          <div style={{
            fontSize:11, fontWeight:700, padding:'3px 9px',
            borderRadius:20, color:pass.color, background:pass.bg,
          }}>
            {pass.text}
          </div>
        </div>
      </div>

      {/* ── Accuracy bar ── */}
      {session.questionsAttempted > 0 && (
        <div style={{ padding:'0 18px 14px' }}>
          <div style={{
            display:'flex', alignItems:'center', justifyContent:'space-between',
            marginBottom:6,
          }}>
            <span style={{ fontSize:12, color:'#64748B', fontWeight:500 }}>
              <CheckCircle2 size={12} style={{ display:'inline', marginRight:4, verticalAlign:'middle', color: pal.color }} />
              {session.questionsCorrect}/{session.questionsAttempted} correct
            </span>
            <span style={{
              fontSize:11, fontWeight:700, fontFamily:'var(--font-mono)',
              color: scoreColor(accuracy),
            }}>
              {accuracy}%
            </span>
          </div>
          <div style={{ height:5, borderRadius:99, background:'#F1F5F9', overflow:'hidden' }}>
            <div style={{
              height:'100%', borderRadius:99,
              width:`${accuracy}%`,
              background: pal.bar,
              transition:'width 600ms ease',
            }} />
          </div>
        </div>
      )}

      {/* ── Teacher feedback ── */}
      <div style={{ padding:'0 18px 16px' }}>
        {session.teacherFeedback ? (
          <div style={{
            background:'rgba(99,102,241,0.05)',
            border:'1px solid rgba(99,102,241,0.14)',
            borderRadius:12, padding:'12px 14px',
          }}>
            <div style={{
              display:'flex', alignItems:'center', gap:6, marginBottom:7,
            }}>
              <div style={{
                width:22, height:22, borderRadius:'50%',
                background:'rgba(99,102,241,0.15)',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                <MessageSquare size={11} color="#6366F1" />
              </div>
              <span style={{ fontSize:11, fontWeight:700, color:'#6366F1', letterSpacing:'0.3px', textTransform:'uppercase' }}>
                Teacher Feedback
              </span>
            </div>
            <p style={{
              fontFamily:'var(--font-body)', fontSize:13,
              color:'#334155', lineHeight:1.6,
              fontStyle:'italic', margin:0,
            }}>
              "{session.teacherFeedback}"
            </p>
          </div>
        ) : (
          <div style={{
            display:'flex', alignItems:'center', gap:7,
            padding:'8px 12px', borderRadius:10,
            border:'1px dashed rgba(0,0,0,0.10)',
          }}>
            <Clock size={13} color="#CBD5E1" />
            <span style={{ fontSize:12, color:'#CBD5E1', fontWeight:500 }}>
              Awaiting teacher feedback
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ feedbackFilter }: { feedbackFilter: FeedbackFilter }) {
  return (
    <div style={{
      display:'flex', flexDirection:'column', alignItems:'center',
      padding:'52px 24px', textAlign:'center',
      background:'#FFFFFF', borderRadius:16,
      border:'1px solid rgba(0,0,0,0.07)',
    }}>
      <div style={{
        width:64, height:64, borderRadius:18, marginBottom:16,
        background: 'rgba(99,102,241,0.08)',
        display:'flex', alignItems:'center', justifyContent:'center',
      }}>
        <ClipboardList size={28} color="#6366F1" strokeWidth={1.8} />
      </div>
      <div style={{ fontSize:17, fontWeight:700, color:'#0F172A', marginBottom:6, fontFamily:'var(--font-display)' }}>
        {feedbackFilter === 'with-feedback'
          ? 'No feedback yet'
          : feedbackFilter === 'needs-review'
            ? 'No sessions need review'
            : 'No practice sessions yet'}
      </div>
      <div style={{ fontSize:13, color:'#94A3B8', maxWidth:280, marginBottom:20, lineHeight:1.6 }}>
        {feedbackFilter === 'with-feedback'
          ? 'Your teacher’s feedback on your kiosk practice sessions will appear here.'
          : feedbackFilter === 'needs-review'
            ? 'All your sessions are scored above 50. Keep it up.'
            : 'Your practice session results from the classroom kiosk will appear here.'}
      </div>
    </div>
  )
}
