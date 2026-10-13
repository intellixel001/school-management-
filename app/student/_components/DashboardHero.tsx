import Image from 'next/image'
import Link from 'next/link'
import { Zap, BarChart2, Sun, Moon, Sunrise } from 'lucide-react'
import { getGreeting } from '@/lib/utils/time'
import type { Student } from '@/types/platform'
import { CosmicBackdrop } from '@/app/kiosk/_components/CosmicBackdrop'

interface Props {
  student: Student
  firstName: string
}

export function DashboardHero({ student, firstName }: Props) {
  const greeting = getGreeting()
  const GreetingIcon = greeting === 'Good morning' ? Sunrise : greeting === 'Good afternoon' ? Sun : Moon
  const iconColor = greeting === 'Good morning' ? '#FBBF24' : greeting === 'Good afternoon' ? '#FB923C' : '#38BDF8'

  return (
    <div className="s-hero" style={{
      background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 40%, #4338CA 100%)',
      borderRadius: 20,
      position: 'relative',
      padding: '32px 32px',
      boxShadow: '0 10px 40px -10px rgba(67,56,202,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
      minHeight: 220,
      flexWrap: 'wrap',
      overflow: 'hidden',
    }}>
      {/* Cosmic background */}
      <div style={{ position: 'absolute', inset: 0, opacity: 1, pointerEvents: 'none' }}>
        <CosmicBackdrop accent="indigo" density="none" seed={student.id} />
      </div>

      {/* Left — greeting + CTAs */}
      <div style={{ position: 'relative', zIndex: 1, flex: 1, minWidth: 0 }}>
        <div className="s-hero-greeting" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          marginBottom: 16,
        }}>
          <GreetingIcon size={16} color={iconColor} strokeWidth={2.5} />
          <span style={{ 
            fontSize: 12, fontWeight: 800, color: '#FFFFFF', letterSpacing: '1.5px',
            textTransform: 'uppercase', fontFamily: 'var(--font-mono)'
          }}>
            {greeting}
          </span>
        </div>

        <h1 className="s-hero-name" style={{
          fontFamily: 'var(--font-display)', fontWeight: 800,
          color: '#FFFFFF', margin: 0, lineHeight: 1.1,
          fontSize: 'clamp(40px, 5vw, 54px)',
          textShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}>
          {firstName}
        </h1>
        <div className="s-hero-ctas" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 28 }}>
          <Link href="/student/quiz" className="s-hero-cta" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: '#FFFFFF', color: '#1E1B4B',
            padding: '12px 24px', borderRadius: 14,
            fontSize: 14, fontWeight: 700, textDecoration: 'none',
            boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
            transition: 'all 200ms ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(255,255,255,0.3)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.2)'
          }}>
            <Zap size={14} fill="#1E1B4B" />
            Quick Quiz
          </Link>
          <Link href="/student/progress" className="s-hero-cta" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.1)', color: '#FFFFFF',
            border: '1.5px solid rgba(255,255,255,0.3)',
            padding: '12px 24px', borderRadius: 14,
            fontSize: 14, fontWeight: 700, textDecoration: 'none',
            transition: 'all 200ms ease',
            backdropFilter: 'blur(10px)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.background = 'rgba(255,255,255,0.2)'
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'
          }}>
            <BarChart2 size={14} />
            My Progress
          </Link>
        </div>
      </div>

      {/* Right — streak block */}
      <div className="s-hero-streak" style={{
        position: 'relative', flexShrink: 0, zIndex: 1,
        background: 'rgba(0,0,0,0.2)',
        border: '1px solid rgba(255,255,255,0.1)',
        backdropFilter: 'blur(12px)',
        borderRadius: 999,
        padding: '10px 28px 10px 14px',
        display: 'flex', alignItems: 'center', gap: 14,
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      }}>
        <div className="s-hero-streak-icon" style={{ width: 48, height: 60, position: 'relative', flexShrink: 0 }}>
          <Image
            src="/Fire.gif"
            alt=""
            width={48}
            height={60}
            unoptimized
            priority
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div className="s-hero-streak-num" style={{
            fontSize: 38, fontWeight: 800, color: '#FFFFFF',
            lineHeight: 1, fontFamily: 'var(--font-mono)',
            textShadow: '0 2px 10px rgba(0,0,0,0.3)'
          }}>
            {student.streak}
          </div>
          <div style={{
            fontSize: 11, color: 'rgba(255,255,255,0.7)',
            fontWeight: 800, letterSpacing: '1px',
            textTransform: 'uppercase', marginTop: 4,
          }}>
            Day Streak
          </div>
        </div>
      </div>
    </div>
  )
}
