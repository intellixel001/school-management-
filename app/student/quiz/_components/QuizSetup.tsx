'use client'

import { Zap, Play } from 'lucide-react'

interface Props {
  onStart: () => void
}

const ACCENT = '#6366F1'

export function QuizSetup({ onStart }: Props) {
  return (
    <div style={{ maxWidth: 600, animation: 'fadeSlideUp 280ms ease-out both' }}>

      {/* ── Hero banner ── */}
      <div style={{
        background: 'linear-gradient(135deg, #F59E0B 0%, #F97316 55%, #EF4444 100%)',
        borderRadius: 20, padding: '26px 28px',
        marginBottom: 28, position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{ position:'absolute', top:-30, right:-30, width:140, height:140, borderRadius:'50%', background:'rgba(255,255,255,0.06)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:-20, left:'30%', width:100, height:100, borderRadius:'50%', background:'rgba(255,255,255,0.05)', pointerEvents:'none' }} />

        <div style={{ position:'relative', zIndex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
            <div style={{ width:32, height:32, borderRadius:10, background:'rgba(255,255,255,0.20)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Zap size={17} color="#FFFFFF" fill="#FFFFFF" />
            </div>
            <span style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.85)', letterSpacing:'0.5px', textTransform:'uppercase' }}>
              Quick Quiz
            </span>
          </div>
          <p style={{ fontSize:16, fontWeight:600, color:'#FFFFFF', margin:'0 0 16px', lineHeight:1.4, maxWidth:340 }}>
            5 multiple-choice questions. Answer correctly to earn points!
          </p>

          {/* Stat chips */}
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            {[
              { emoji:'❓', label:'5 questions'      },
              { emoji:'⏱️', label:'20s per question' },
              { emoji:'🏆', label:'Max 5 pts'        },
            ].map(s => (
              <div key={s.label} style={{
                display:'inline-flex', alignItems:'center', gap:5,
                background:'rgba(255,255,255,0.18)', borderRadius:20,
                padding:'5px 12px', fontSize:12, fontWeight:600,
                color:'#FFFFFF', backdropFilter:'blur(4px)',
              }}>
                <span>{s.emoji}</span> {s.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Start button ── */}
      <button
        type="button"
        onClick={onStart}
        style={{
          display:'inline-flex', alignItems:'center', gap:10,
          padding:'14px 32px', borderRadius:14,
          background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT}CC 100%)`,
          color:'#FFFFFF', border:'none',
          fontFamily:'var(--font-body)', fontSize:16, fontWeight:700,
          cursor:'pointer', outline:'none',
          boxShadow:`0 6px 20px ${ACCENT}44`,
          transition:'all 200ms ease',
          minHeight:50,
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 10px 28px ${ACCENT}55` }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)';   e.currentTarget.style.boxShadow = `0 6px 20px ${ACCENT}44` }}
      >
        <Play size={17} fill="#FFFFFF" />
        Start Quiz
      </button>
    </div>
  )
}
