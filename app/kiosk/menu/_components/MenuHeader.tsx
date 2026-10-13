import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Flame, ArrowLeft } from 'lucide-react'
import { Badge } from '@/components/ui'
import { useTransition } from '../../_components/TransitionProvider'
import { useKioskSession } from '../../_components/KioskSessionProvider'
import LogoutModal from '../../_components/LogoutModal'
import type { Student } from '@/types/platform'
import type { SkillLevel } from '@/types/platform'

const LEVEL_SHORT: Record<SkillLevel, string> = {
  'entry-1': 'E1',
  'entry-2': 'E2',
  'entry-3': 'E3',
  'level-1': 'L1',
}

interface MenuHeaderProps {
  student: Student
  centerTitle?: string
  /** When set, a large back button is rendered on the left of the header. */
  backHref?: string
  hideWelcomePrefix?: boolean
  hideGreetingBlock?: boolean
}

export default function MenuHeader({ student, centerTitle = 'Choose your training', backHref, hideWelcomePrefix, hideGreetingBlock }: MenuHeaderProps) {
  const router = useRouter()
  const { playTransition } = useTransition()
  const { clear } = useKioskSession()
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false)
  
  const firstName = student.name ? student.name.split(' ')[0] : ''
  const greeting = hideWelcomePrefix 
    ? firstName 
    : (firstName ? `Welcome back, ${firstName}` : 'Welcome back')
  const levelShort = LEVEL_SHORT[student.level]

  const today = new Date()
  const dateString = today.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  }).toUpperCase().replace(/,/g, ' ·') // e.g. THU · JUN 19

  return (
    <div
      className="menu-header"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        height: 136,
        padding: '0 48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(18, 10, 8, 0.42)',
        backdropFilter: 'blur(24px) saturate(140%)',
        WebkitBackdropFilter: 'blur(24px) saturate(140%)',
        borderBottom: '1px solid rgba(198, 158, 92, 0.16)'
      }}
    >
      {/* Left block */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 27 }}>
        {backHref && (
          <button
            onClick={() => router.push(backHref)}
            onPointerDown={(e) => { e.currentTarget.style.transform = 'scale(0.94)' }}
            onPointerUp={(e)   => { e.currentTarget.style.transform = 'scale(1)' }}
            onPointerLeave={(e)=> { e.currentTarget.style.transform = 'scale(1)' }}
            aria-label="Back"
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '0 27px', height: 71,
              borderRadius: 15,
              border: '1px solid rgba(255,255,255,0.14)',
              background: 'rgba(255,255,255,0.06)',
              color: 'var(--text-primary)',
              cursor: 'pointer', outline: 'none',
              transition: 'transform 100ms ease, background 100ms ease',
            }}
          >
            <ArrowLeft size={27} />
            <span className="font-display font-bold" style={{ fontSize: 24 }}>Back</span>
          </button>
        )}
        {!hideGreetingBlock && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span
              className="font-display"
              style={{
                fontSize: 42,
                fontWeight: 600,
                background: 'linear-gradient(180deg, #FBF3E2 0%, #D9BD87 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.01em',
                lineHeight: 1.15,
              }}
            >
              {greeting}
            </span>
            <span
              className="font-mono"
              style={{
                fontSize: 18,
                color: 'rgba(232, 185, 108, 0.75)',
                textTransform: 'uppercase',
                letterSpacing: 'var(--tracking-caps)',
                lineHeight: 1.2,
                opacity: 0.85,
              }}
            >
              {dateString}
            </span>
          </div>
        )}
      </div>

      {/* Right block */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 17 }}>
        <div
          style={{
            background: 'rgba(198, 158, 92, 0.14)',
            border: '1px solid rgba(198, 158, 92, 0.3)',
            color: '#F5EDD8',
            padding: '8.5px 17px',
            borderRadius: 999,
            fontFamily: 'var(--font-display), sans-serif',
            fontWeight: 700,
            fontSize: 19,
            letterSpacing: '0.02em',
          }}
        >
          {levelShort}
        </div>

        {student.streak > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              padding: '8.5px 17px',
              borderRadius: 999,
              background: 'color-mix(in srgb, #E8B96C 12%, transparent)',
              border: '1px solid color-mix(in srgb, #E8B96C 30%, transparent)',
              color: '#E8B96C',
            }}
          >
            <Flame size={19} />
            <span className="font-mono" style={{ fontSize: 17, fontWeight: 700 }}>
              {student.streak}
            </span>
          </div>
        )}

        <button
          onClick={() => setIsLogoutModalOpen(true)}
          onPointerDown={(e) => {
            e.currentTarget.style.transform = 'scale(0.94)'
            e.currentTarget.style.background = 'color-mix(in srgb, var(--accent-danger) 12%, transparent)'
          }}
          onPointerUp={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'
          }}
          onPointerLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            padding: '0 34px',
            height: 71,
            borderRadius: 15,
            border: '1px solid color-mix(in srgb, var(--accent-danger) 30%, transparent)',
            color: 'var(--accent-danger)',
            background: 'rgba(255, 255, 255, 0.04)',
            cursor: 'pointer',
            transition: 'transform 100ms ease, background 100ms ease',
            outline: 'none',
          }}
        >
          <LogOut size={26} />
          <span className="font-display font-bold text-white" style={{ fontSize: 24 }}>Log Out</span>
        </button>
      </div>

      <LogoutModal 
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={async () => {
          setIsLogoutModalOpen(false)
          clear()
          await playTransition('any-to-pin')
          router.push('/kiosk')
        }}
      />
    </div>
  )
}
