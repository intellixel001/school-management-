// SkillHealthTrends — server-renderable since TrendChart is 'use client' itself.

import { TrendChart } from '@/components/charts/TrendChart'
import { SKILL_CONFIG, SKILL_ORDER } from '@/lib/skillConfig'
import type { SkillArea } from '@/types/platform'

const SKILL_COLORS: Record<SkillArea, string> = {
  reading:   '#6366F1',
  writing:   '#059669',
  speaking:  '#D97706',
  listening: '#3B82F6',
}

interface SkillAvgPoint {
  score: number
  date: string
}

interface SkillHealthTrendsProps {
  skillPoints: Record<SkillArea, SkillAvgPoint[]>
  currentAvgs: Record<SkillArea, number>
  /** Pass null when no previous-period baseline is available (no fake deltas). */
  prevAvgs: Record<SkillArea, number> | null
}

export function SkillHealthTrends({ skillPoints, currentAvgs, prevAvgs }: SkillHealthTrendsProps) {
  return (
    <div>
      {/* 2×2 chart grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20, marginBottom: 22 }}>
        {SKILL_ORDER.map(skill => (
          <TrendChart
            key={skill}
            title={SKILL_CONFIG[skill].label}
            currentScore={currentAvgs[skill]}
            accentColor={SKILL_COLORS[skill]}
            dataPoints={skillPoints[skill]}
          />
        ))}
      </div>

      {/* Premium summary row — skill mini-cards */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12,
        borderTop: '1px solid var(--border-subtle)', paddingTop: 18,
      }}>
        {SKILL_ORDER.map(skill => {
          const curr       = currentAvgs[skill]
          // If no baseline is available (prevAvgs === null), show 0 delta (no arrow rendered)
          const delta      = prevAvgs !== null ? curr - prevAvgs[skill] : 0
          const color      = SKILL_COLORS[skill]
          const deltaColor = delta > 0 ? '#10B981' : delta < 0 ? '#EF4444' : 'var(--text-muted)'
          const arrow      = delta > 0 ? '↑' : delta < 0 ? '↓' : '→'
          const Icon       = SKILL_CONFIG[skill].icon

          return (
            <div
              key={skill}
              style={{
                padding: '12px 14px', borderRadius: 11,
                background: `${color}08`,
                border: `1px solid ${color}1A`,
              }}
            >
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8,
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: 6,
                  background: `${color}18`, border: `1px solid ${color}28`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={11} style={{ color }} />
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 700, color,
                  textTransform: 'uppercase', letterSpacing: '0.5px',
                }}>
                  {SKILL_CONFIG[skill].label}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 24, fontWeight: 800,
                  color: 'var(--text-primary)', lineHeight: 1,
                }}>
                  {curr}
                </span>
                {Math.abs(delta) > 0 && (
                  <span style={{
                    fontSize: 12, fontWeight: 700, color: deltaColor,
                    fontFamily: 'var(--font-mono)',
                  }}>
                    {arrow}{Math.abs(delta)}
                  </span>
                )}
              </div>

              {/* Progress bar */}
              <div style={{
                height: 4, borderRadius: 2,
                background: 'var(--border-subtle)',
                overflow: 'hidden', marginTop: 8,
              }}>
                <div style={{
                  width: `${curr}%`, height: '100%', borderRadius: 2,
                  background: `linear-gradient(90deg, ${color}80 0%, ${color} 100%)`,
                  transition: 'width 600ms ease',
                }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
