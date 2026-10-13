'use client'

import { LEVEL_SHORT, LEVEL_LABEL } from '@/lib/levelConfig'
import type { Student } from '@/types/platform'
import { TrendingUp } from 'lucide-react'

interface Props {
  student: Student
}

export function LevelCard({ student }: Props) {
  const skillAvg = Math.round(
    (student.skills.reading + student.skills.writing + student.skills.speaking + student.skills.listening) / 4
  )

  return (
    <div className="s-level-card" style={{
      background: 'linear-gradient(135deg, #064E3B 0%, #047857 50%, #059669 100%)',
      borderRadius: 20,
      padding: '32px 28px',
      boxShadow: '0 10px 40px -10px rgba(5,150,105,0.5), inset 0 1px 0 rgba(255,255,255,0.2)',
      border: '1px solid rgba(52,211,153,0.3)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      gap: 18,
      minHeight: 220,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Decorative Orbs for Dynamic Beauty */}
      <div style={{ position: 'absolute', top: -30, right: -30, width: 150, height: 150, background: 'radial-gradient(circle, rgba(110,231,183,0.25) 0%, transparent 70%)', filter: 'blur(30px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -50, left: -20, width: 200, height: 200, background: 'radial-gradient(circle, rgba(16,185,129,0.2) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none' }} />

      {/* Header */}
      <div className="s-level-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
        <span style={{
          fontSize: 11, fontWeight: 700, color: '#A7F3D0',
          letterSpacing: '1.2px', textTransform: 'uppercase',
        }}>
          Current Level
        </span>
        <div className="s-level-icon" style={{
          width: 32, height: 32, borderRadius: 10,
          background: 'rgba(255,255,255,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid rgba(255,255,255,0.2)',
          backdropFilter: 'blur(10px)',
        }}>
          <TrendingUp size={16} color="#6EE7B7" strokeWidth={2.2} />
        </div>
      </div>

      {/* Level badge */}
      <div className="s-level-badge" style={{ position: 'relative', zIndex: 1 }}>
        <div className="s-level-num" style={{
          fontSize: 64, fontWeight: 900, color: '#FFFFFF',
          lineHeight: 1, fontFamily: 'var(--font-display)',
          textShadow: '0 4px 20px rgba(0,0,0,0.15)',
        }}>
          {LEVEL_SHORT[student.level]}
        </div>
        <div className="s-level-label" style={{
          fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 8, fontWeight: 500,
        }}>
          {LEVEL_LABEL[student.level]}
        </div>
      </div>

      {/* Progress + week */}
      <div className="s-level-progress" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{
          height: 6, borderRadius: 99,
          background: 'rgba(0,0,0,0.25)',
          overflow: 'hidden',
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2)',
        }}>
          <div style={{
            height: '100%', borderRadius: 99,
            width: `${skillAvg}%`,
            background: 'linear-gradient(90deg, #34D399 0%, #A7F3D0 100%)',
            transition: 'width 600ms ease',
            boxShadow: '0 0 10px rgba(52,211,153,0.5)',
          }} />
        </div>
        <div className="s-level-avg-row" style={{
          display: 'flex', justifyContent: 'flex-end',
          marginTop: 12, fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: 500,
        }}>
          <span>Skill avg <strong style={{ color: '#FFFFFF' }}>{skillAvg}/100</strong></span>
        </div>
      </div>
    </div>
  )
}
