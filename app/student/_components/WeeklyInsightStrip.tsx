'use client'

import { useEffect, useState } from 'react'
import { Sparkles, RefreshCw } from 'lucide-react'
import Image from 'next/image'

interface InsightResponse {
  insight: string
  suggestedSkill: 'reading' | 'writing' | 'listening' | 'speaking' | null
  source: 'ai' | 'fallback'
}

function SkeletonText() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, opacity: 0.5 }}>
      <div style={{ height: 14, background: 'rgba(255,255,255,0.2)', borderRadius: 6, width: '90%' }} />
      <div style={{ height: 14, background: 'rgba(255,255,255,0.2)', borderRadius: 6, width: '60%' }} />
    </div>
  )
}

export function WeeklyInsightStrip({ studentId }: { studentId: string }) {
  const [data, setData] = useState<InsightResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  async function load() {
    setLoading(true)
    setError(false)
    try {
      const res = await fetch(`/api/student-insight?studentId=${studentId}`)
      if (!res.ok) throw new Error('insight fetch failed')
      const json = await res.json()
      setData(json)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [studentId])

  return (
    <div className="s-insight-strip" style={{
      background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)',
      borderRadius: 20,
      padding: '24px 32px 24px 20px',
      boxShadow: '0 8px 32px rgba(49, 46, 129, 0.25), inset 0 1px 0 rgba(255,255,255,0.1)',
      display: 'flex', alignItems: 'center', gap: 24,
      minHeight: 110,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Glow effects */}
      <div style={{ position: 'absolute', top: -40, left: -40, width: 150, height: 150, background: 'radial-gradient(circle, rgba(124,58,237,0.5) 0%, transparent 70%)', filter: 'blur(30px)' }} />
      <div style={{ position: 'absolute', bottom: -50, right: -20, width: 200, height: 200, background: 'radial-gradient(circle, rgba(56,189,248,0.15) 0%, transparent 70%)', filter: 'blur(40px)' }} />

      {/* Mascot Image */}
      <div className="s-insight-mascot" style={{
        position: 'relative',
        width: 80, height: 80, flexShrink: 0, zIndex: 1,
        filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.4))',
        transform: 'scale(1.3) translateY(2px)',
        marginLeft: 12,
      }}>
        <Image
          src="/RobotSaludando.gif"
          alt="AI Tutor Mascot"
          fill
          style={{ objectFit: 'contain' }}
          unoptimized
          priority
        />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0, position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Sparkles size={16} color="#38BDF8" fill="#38BDF8" />
          <span style={{ 
            fontSize: 13, fontWeight: 800, color: '#38BDF8', letterSpacing: '1px', 
            textTransform: 'uppercase', fontFamily: 'var(--font-mono)' 
          }}>
            AI Insight
          </span>
        </div>
        
        {loading ? <SkeletonText /> : error ? null : (
          <p style={{ 
            margin: 0, fontSize: 16, color: '#F8FAFC', 
            lineHeight: 1.6, fontWeight: 500,
            textShadow: '0 2px 10px rgba(0,0,0,0.3)',
            maxWidth: '90%',
          }}>
            {data?.insight}
          </p>
        )}
      </div>

      {/* Refresh Button */}
      <button
        className="s-insight-refresh"
        onClick={load}
        disabled={loading}
        aria-label="Refresh insight"
        style={{
          position: 'relative', zIndex: 1, flexShrink: 0,
          background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.25)',
          padding: '10px 18px', borderRadius: 14, cursor: loading ? 'wait' : 'pointer',
          color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700,
          backdropFilter: 'blur(10px)', transition: 'all 200ms ease',
        }}
        onMouseEnter={(e) => {
          if (!loading) {
            e.currentTarget.style.background = 'rgba(255,255,255,0.2)'
            e.currentTarget.style.transform = 'translateY(-2px)'
          }
        }}
        onMouseLeave={(e) => {
          if (!loading) {
            e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
            e.currentTarget.style.transform = 'translateY(0)'
          }
        }}
      >
        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        <span className="s-insight-refresh-label">Refresh</span>
      </button>
    </div>
  )
}
