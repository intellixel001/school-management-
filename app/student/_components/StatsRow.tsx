'use client'

import { Activity, Award, Clock4, Zap } from 'lucide-react'

interface Props {
  sessions: number     // practice sessions only
  points: number
  hours: number
  quizzes: number      // count of completed quizzes
}

export function StatsRow({ sessions, points, hours, quizzes }: Props) {
  const statCards = [
    {
      Icon: Activity,
      color: '#818CF8', // Indigo 400
      accent: 'rgba(129, 140, 248, 0.15)',
      label: 'Sessions Done',
      value: String(sessions),
    },
    {
      Icon: Award,
      color: '#A78BFA', // Violet 400
      accent: 'rgba(167, 139, 250, 0.15)',
      label: 'Total Points',
      value: String(points),
    },
    {
      Icon: Clock4,
      color: '#22D3EE', // Cyan 400
      accent: 'rgba(34, 211, 238, 0.15)',
      label: 'Hours Practiced',
      value: `${hours}h`,
    },
    {
      Icon: Zap,
      color: '#A78BFA', // Violet 400
      accent: 'rgba(167, 139, 250, 0.15)',
      label: 'Quizzes Done',
      value: String(quizzes),
      sub: undefined,
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 w-full">
      {statCards.map((s, i) => (
        <div key={i} className="group relative overflow-hidden" style={{
          background: 'linear-gradient(135deg, #1E1B4B 0%, #11102A 100%)', // Deep premium indigo
          borderRadius: 24,
          padding: '24px',
          boxShadow: `inset 0 0 0 2px #11102A, inset 0 0 0 3px ${s.color}99, 0 12px 30px rgba(15,23,42,0.5)`,
          border: `1px solid ${s.color}99`,
          display: 'flex', flexDirection: 'column', gap: 20,
          transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}>
          {/* Neon Glow Orb */}
          <div style={{
            position: 'absolute', top: -40, right: -40, width: 140, height: 140,
            background: `radial-gradient(circle, ${s.accent} 0%, transparent 70%)`,
            filter: 'blur(20px)', zIndex: 0,
            transition: 'transform 500ms ease, opacity 300ms ease',
          }} className="group-hover:scale-110 opacity-60 group-hover:opacity-100" />

          {/* Top accent border */}
          <div style={{
            position: 'absolute', top: 0, left: 24, right: 24, height: 2,
            background: `linear-gradient(90deg, transparent, ${s.color}, transparent)`,
            opacity: 0.3,
            transition: 'opacity 300ms ease'
          }} className="group-hover:opacity-100" />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 1, position: 'relative' }}>
            <div style={{
              width: 52, height: 52, borderRadius: 16,
              background: 'rgba(255,255,255,0.03)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: s.color,
              boxShadow: `inset 0 0 20px ${s.accent}`
            }}>
              <s.Icon size={24} strokeWidth={2} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', zIndex: 1, position: 'relative' }}>
            <div style={{ 
              fontSize: 13, color: '#94A3B8', fontWeight: 600, 
              textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6
            }}>
              {s.label}
            </div>
            
            <div className="s-stat-value transition-transform duration-300 ease-out group-hover:translate-x-1" style={{
              fontSize: 38,
              fontWeight: 800, color: '#FFFFFF',
              lineHeight: 1, fontFamily: 'var(--font-display)',
              letterSpacing: '-0.5px',
            }}>
              {s.value}
            </div>
            
            {s.sub && (
              <div style={{ 
                fontSize: 12, color: s.color, fontWeight: 700, marginTop: 10,
                display: 'inline-flex', alignItems: 'center', gap: 4,
                background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: 8,
                alignSelf: 'flex-start', border: '1px solid rgba(255,255,255,0.1)'
              }}>
                {s.sub}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
