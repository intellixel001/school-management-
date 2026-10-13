'use client'

import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { SKILL_CONFIG, SKILL_ORDER } from '@/lib/skillConfig'
import type { SkillArea } from '@/types/platform'

// ── Per-skill colour palette ──────────────────────────────────────────────────
const PAL: Record<SkillArea, {
  color: string; bar: string; bg: string;
  border: string; glow: string; watermark: string;
}> = {
  reading:   { color:'#6366F1', bar:'linear-gradient(90deg,#6366F1,#818CF8)', bg:'rgba(99,102,241,0.07)',  border:'rgba(99,102,241,0.22)', glow:'0 16px 48px rgba(99,102,241,0.22)',  watermark:'rgba(99,102,241,0.04)'  },
  writing:   { color:'#10B981', bar:'linear-gradient(90deg,#10B981,#34D399)', bg:'rgba(16,185,129,0.07)',  border:'rgba(16,185,129,0.22)', glow:'0 16px 48px rgba(16,185,129,0.22)',  watermark:'rgba(16,185,129,0.04)'  },
  speaking:  { color:'#F59E0B', bar:'linear-gradient(90deg,#F59E0B,#FCD34D)', bg:'rgba(245,158,11,0.07)',  border:'rgba(245,158,11,0.22)', glow:'0 16px 48px rgba(245,158,11,0.22)',  watermark:'rgba(245,158,11,0.04)'  },
  listening: { color:'#EC4899', bar:'linear-gradient(90deg,#EC4899,#F472B6)', bg:'rgba(236,72,153,0.07)',  border:'rgba(236,72,153,0.22)', glow:'0 16px 48px rgba(236,72,153,0.22)',  watermark:'rgba(236,72,153,0.04)'  },
}

// ── Mini SVG score ring ───────────────────────────────────────────────────────
function ScoreRing({ score, color, active }: { score: number; color: string; active: boolean }) {
  const r    = 20
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  return (
    <svg width={54} height={54} viewBox="0 0 54 54" style={{ flexShrink: 0, overflow: 'visible' }}>
      <circle cx={27} cy={27} r={r} fill="none" stroke="#F1F5F9" strokeWidth={4.5} />
      <circle
        cx={27} cy={27} r={r} fill="none"
        stroke={active ? color : '#CBD5E1'}
        strokeWidth={4.5}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 27 27)"
        style={{ transition: 'stroke 220ms ease, stroke-dasharray 600ms ease' }}
      />
      <text x={27} y={32} textAnchor="middle"
        fontSize={13} fontWeight={700}
        fill={active ? color : '#64748B'}
        style={{ transition: 'fill 220ms ease', fontFamily: 'monospace' }}>
        {score}
      </text>
    </svg>
  )
}

// ── Individual skill card ─────────────────────────────────────────────────────
function SkillCard({ skill, score, delay, onSelect }: {
  skill: SkillArea; score: number; delay: number; onSelect: (s: SkillArea) => void
}) {
  const [hov, setHov] = useState(false)
  const [prs, setPrs] = useState(false)

  const cfg = SKILL_CONFIG[skill]
  const pal = PAL[skill]
  const Icon = cfg.icon

  const scoreLabel       = score >= 75 ? 'Strong 💪' : score >= 50 ? 'Good 👍' : 'Keep going 🎯'
  const scoreLabelColor  = score >= 75 ? '#10B981'   : score >= 50 ? '#F59E0B' : '#EF4444'

  return (
    <button
      type="button"
      onClick={() => onSelect(skill)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => { setHov(false); setPrs(false) }}
      onMouseDown={() => setPrs(true)}
      onMouseUp={() => setPrs(false)}
      onTouchStart={() => setPrs(true)}
      onTouchEnd={() => setPrs(false)}
      onTouchCancel={() => { setPrs(false); setHov(false) }}
      aria-label={`Practice ${cfg.label}`}
      style={{
        display: 'block', textAlign: 'left', width: '100%',
        padding: '24px 24px 20px',
        background: hov ? `linear-gradient(150deg, ${pal.bg.replace('0.07','0.10')} 0%, #FFFFFF 100%)` : '#FFFFFF',
        border: `1.5px solid ${hov ? pal.border : 'rgba(0,0,0,0.07)'}`,
        borderRadius: 20, cursor: 'pointer', outline: 'none',
        transform: prs ? 'scale(0.97)' : hov ? 'translateY(-5px)' : 'translateY(0)',
        boxShadow: hov ? pal.glow : '0 1px 3px rgba(0,0,0,0.06)',
        transition: 'all 220ms cubic-bezier(0.4,0,0.2,1)',
        animation: `fadeSlideUp 300ms ease-out ${delay}ms both`,
        position: 'relative', overflow: 'hidden',
      }}
    >
      {/* Top accent bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: hov ? pal.bar : 'transparent',
        transition: 'background 220ms ease',
        borderRadius: '20px 20px 0 0',
      }} />

      {/* Watermark icon — large faint bg */}
      <div style={{
        position: 'absolute', bottom: -8, right: -8,
        color: pal.watermark, pointerEvents: 'none',
        transition: 'color 220ms ease',
      }}>
        <Icon size={90} strokeWidth={1} />
      </div>

      {/* Top row: icon box + score ring */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, position: 'relative', zIndex: 1 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14, flexShrink: 0,
          background: hov ? pal.bg : 'rgba(0,0,0,0.04)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 220ms ease',
        }}>
          <Icon size={24} color={hov ? pal.color : '#94A3B8'} strokeWidth={2} style={{ transition: 'color 220ms ease' }} />
        </div>
        <ScoreRing score={score} color={pal.color} active={hov} />
      </div>

      {/* Text content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700,
          color: '#0F172A', marginBottom: 4,
        }}>
          {cfg.label}
        </div>
        <div style={{ fontSize: 13, color: '#94A3B8', marginBottom: 18 }}>
          {cfg.description}
        </div>

        {/* Progress bar */}
        <div style={{ height: 6, borderRadius: 99, background: '#F1F5F9', overflow: 'hidden', marginBottom: 7 }}>
          <div style={{
            height: '100%', borderRadius: 99, width: `${score}%`,
            background: pal.bar, transition: 'width 700ms ease',
          }} />
        </div>

        {/* Score row — label swaps to "Start →" on hover (in-flow, no absolute overlap) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, color: '#94A3B8' }}>
            Score: <strong style={{ color: '#0F172A', fontFamily: 'monospace' }}>{score}/100</strong>
          </span>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 3,
            fontSize: 11, fontWeight: 700,
            color: hov ? pal.color : scoreLabelColor,
            transition: 'color 180ms ease',
          }}>
            {hov ? <><span>Start</span><ArrowRight size={12} /></> : scoreLabel}
          </span>
        </div>
      </div>
    </button>
  )
}

// ── Grid ──────────────────────────────────────────────────────────────────────
interface Props {
  skillScores: Record<SkillArea, number>
  onSelect: (skill: SkillArea) => void
}

export function SkillSelectGrid({ skillScores, onSelect }: Props) {
  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28, animation: 'fadeSlideUp 250ms ease-out both' }}>
        <h2 style={{
          fontFamily: 'var(--font-display)', fontSize: 23, fontWeight: 800,
          color: '#0F172A', margin: 0,
        }}>
          What will you practise today?
        </h2>
        <p style={{ fontSize: 14, color: '#94A3B8', marginTop: 5, marginBottom: 0 }}>
          Pick a skill — 10 questions, instant AI feedback.
        </p>
      </div>

      {/* 2-up grid — pb-24 on mobile so cards clear the fixed bottom nav */}
      <div className="grid grid-cols-1 sm:grid-cols-2 pb-24 sm:pb-6" style={{ gap: 16 }}>
        {SKILL_ORDER.map((skill, i) => (
          <SkillCard
            key={skill}
            skill={skill}
            score={skillScores[skill]}
            delay={i * 70}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  )
}
