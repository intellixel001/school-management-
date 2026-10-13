import type { ReactNode } from 'react'

interface Props {
  /** Small uppercase tag above the title (e.g. "Practice Feedback"). */
  eyebrow: string
  /** Main heading. */
  title: string
  /** Single-line subtitle below the title. */
  subtitle?: string
  /** Optional right-side slot for stat pills, action buttons, etc. */
  rightSlot?: ReactNode
}

export function TeacherPageHero({ eyebrow, title, subtitle, rightSlot }: Props) {
  return (
    <div style={{
      background: `
        radial-gradient(ellipse 60% 80% at 85% 20%, rgba(77,159,255,0.18) 0%, transparent 60%),
        radial-gradient(ellipse 50% 70% at 95% 100%, rgba(124,58,237,0.14) 0%, transparent 55%),
        radial-gradient(ellipse 40% 60% at 30% 110%, rgba(56,189,248,0.10) 0%, transparent 60%),
        linear-gradient(135deg, #0A1628 0%, #0E2444 55%, #12305C 100%)
      `,
      borderRadius: 18, padding: '28px 30px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      overflow: 'hidden', position: 'relative',
      border: '1px solid rgba(77,159,255,0.16)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 8px 28px rgba(10,22,40,0.35)',
    }}>
      {/* Dot grid overlay */}
      <div
        aria-hidden
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
          opacity: 0.55,
          maskImage: 'linear-gradient(to right, rgba(0,0,0,0.7), transparent 75%)',
          WebkitMaskImage: 'linear-gradient(to right, rgba(0,0,0,0.7), transparent 75%)',
        }}
      />

      {/* SVG waveform flourish */}
      <svg
        aria-hidden
        viewBox="0 0 320 180"
        preserveAspectRatio="none"
        style={{
          position: 'absolute', right: 0, bottom: 0,
          width: 360, height: 180, opacity: 0.22, pointerEvents: 'none',
        }}
      >
        <defs>
          <linearGradient id="teacher-hero-wave" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4D9FFF" stopOpacity="0.0" />
            <stop offset="100%" stopColor="#4D9FFF" stopOpacity="0.55" />
          </linearGradient>
        </defs>
        <path
          d="M0,140 C60,90 120,160 180,110 C240,60 280,130 320,90 L320,180 L0,180 Z"
          fill="url(#teacher-hero-wave)"
        />
        <path
          d="M0,150 C70,120 140,170 220,130 C260,108 290,140 320,120"
          fill="none"
          stroke="rgba(124,58,237,0.45)"
          strokeWidth="1.2"
        />
      </svg>

      {/* Left — eyebrow + title + subtitle */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{
          fontSize: 10, color: '#4D9FFF', fontWeight: 700,
          letterSpacing: '1px', textTransform: 'uppercase',
          marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: '#4D9FFF', boxShadow: '0 0 6px #4D9FFF',
          }} />
          {eyebrow}
        </div>
        <h1 style={{
          fontSize: 26, fontWeight: 800, color: '#F1F5F9',
          margin: 0, lineHeight: 1.2,
          fontFamily: 'var(--font-display)',
        }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{
            fontSize: 13, color: '#94A3B8',
            margin: '6px 0 0',
            fontFamily: 'var(--font-body)',
          }}>
            {subtitle}
          </p>
        )}
      </div>

      {/* Right slot */}
      {rightSlot && (
        <div className="hidden sm:flex" style={{
          gap: 10, flexShrink: 0,
          position: 'relative', zIndex: 1,
          alignItems: 'center',
        }}>
          {rightSlot}
        </div>
      )}
    </div>
  )
}
