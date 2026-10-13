'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard, BookOpen, Zap, BarChart2, FileText,
  ChevronLeft, ChevronRight, Lock, ClipboardList
} from 'lucide-react'
import { Tooltip } from '@/components/ui'
import { DUMMY_STUDENTS } from '@/lib/dummy/students'
import { LEVEL_SHORT, LEVEL_LABEL } from '@/lib/levelConfig'
import { LogoutButton } from '@/app/student/_components/LogoutButton'
import { useStudentSession } from '@/app/student/_components/StudentSessionProvider'
import { getStudentById } from '@/lib/services'
import type { Student } from '@/types/platform'

// Practice is placed last per product spec — locked feature stays out of the way.
const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard',   href: '/student' },
  { icon: Zap,             label: 'Quick Quiz',  href: '/student/quiz' },
  { icon: BarChart2,       label: 'My Progress', href: '/student/progress' },
  { icon: FileText,        label: 'My Results',  href: '/student/results' },
  { icon: ClipboardList,   label: 'Mock Exams',  href: '/student/mocks' },
  { icon: BookOpen,        label: 'Practice',    href: '/student/practice', locked: true },
]

// ── Dark sidebar nav link ─────────────────────────────────────────────────────
function SideNavLink({
  href, icon: Icon, label, isActive, isCollapsed, isLocked
}: {
  href: string
  icon: typeof LayoutDashboard
  label: string
  isActive: boolean
  isCollapsed: boolean
  isLocked?: boolean
}) {
  return (
    <Link href={href} className={`student-nav-link${isActive ? ' active' : ''}`}>
      <Icon
        size={18}
        strokeWidth={isActive ? 2 : 1.6}
        className="student-nav-icon"
        style={{ flexShrink: 0 }}
      />
      {!isCollapsed && (
        <span style={{
          overflow: 'hidden', whiteSpace: 'nowrap',
          opacity: 1, transition: 'opacity 300ms ease',
          display: 'flex', alignItems: 'center', gap: 6, flex: 1
        }}>
          <span>{label}</span>
          {isLocked && <Lock size={12} strokeWidth={2.5} style={{ opacity: 0.4 }} />}
        </span>
      )}
    </Link>
  )
}

// ── Student avatar circle ─────────────────────────────────────────────────────
function AvatarCircle({ name, size = 36 }: { name: string; size?: number }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.36, fontWeight: 700, color: '#FFFFFF',
      letterSpacing: '-0.5px',
    }}>
      {initials}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export function StudentNav() {
  const pathname    = usePathname()
  const { session } = useStudentSession()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMounted,   setIsMounted]   = useState(false)
  const [student,     setStudent]     = useState<Student>(DUMMY_STUDENTS[0])

  // Load the real logged-in student's profile so the bottom identity card
  // shows the correct name / level / streak instead of the first dummy user.
  useEffect(() => {
    if (!session?.studentId) return
    let cancelled = false
    getStudentById(session.studentId)
      .then(s => { if (!cancelled && s) setStudent(s) })
      .catch(() => { /* keep fallback */ })
    return () => { cancelled = true }
  }, [session?.studentId])

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true)
      const saved = localStorage.getItem('ec-student-nav-collapsed')
      if (saved !== null) {
        setIsCollapsed(saved === 'true')
      } else if (window.innerWidth < 1024) {
        setIsCollapsed(true)
      }
    }, 0)

    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsCollapsed(true)
      } else {
        const saved = localStorage.getItem('ec-student-nav-collapsed')
        if (saved !== 'true') setIsCollapsed(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => { clearTimeout(timer); window.removeEventListener('resize', handleResize) }
  }, [])

  const toggleCollapse = () => {
    const next = !isCollapsed
    setIsCollapsed(next)
    localStorage.setItem('ec-student-nav-collapsed', String(next))
  }

  const sidebarWidth = !isMounted ? 224 : isCollapsed ? 60 : 224

  // ── Mobile bottom bar ───────────────────────────────────────────────────────
  const mobileNav = (
    <nav
      className="mobile-bottom-nav md:hidden fixed bottom-0 left-0 right-0 z-50 flex justify-between items-center px-2 pt-2"
      style={{
        background: '#0D1B2A',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
      }}
    >
      {NAV_ITEMS.slice(0, 4).map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex-1 flex flex-col items-center justify-center gap-1 p-2 rounded-lg"
            style={{
              color: isActive ? '#818CF8' : '#475569',
              textDecoration: 'none',
            }}
          >
            <item.icon size={20} strokeWidth={isActive ? 2 : 1.5} />
            <span style={{ fontSize: 10, fontWeight: 600 }}>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )

  // ── Desktop sidebar ─────────────────────────────────────────────────────────
  const desktopNav = (
    <aside
      className="hidden md:flex flex-col relative z-40 h-[100dvh]"
      style={{
        width: sidebarWidth,
        background: '#0D1B2A',
        borderRight: '1px solid rgba(255,255,255,0.07)',
        transition: 'width 320ms cubic-bezier(0.4,0,0.2,1)',
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      {/* ── Logo ── */}
      <div style={{
        padding: '18px 12px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 38 }}>
          {/* Logo mark */}
          <div style={{
            width: 34, height: 34, borderRadius: 10, flexShrink: 0,
            background: 'linear-gradient(135deg, #818CF8 0%, #6366F1 50%, #4F46E5 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.5px',
            boxShadow: '0 4px 12px rgba(99,102,241,0.40)',
          }}>
            EC
          </div>

          {/* Brand name — fades out when collapsed */}
          <div style={{
            overflow: 'hidden', whiteSpace: 'nowrap',
            opacity: isCollapsed ? 0 : 1,
            transition: 'opacity 250ms ease',
            minWidth: 0,
          }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#F1F5F9', lineHeight: 1.2 }}>
              English AI Tutor
            </div>
            <div style={{
              fontSize: 10, color: '#818CF8', fontWeight: 600,
              letterSpacing: '0.8px', textTransform: 'uppercase', marginTop: 1,
            }}>
              AI Tutor
            </div>
          </div>
        </div>
      </div>

      {/* ── Nav links ── */}
      <div style={{
        flex: 1, padding: '12px 8px',
        display: 'flex', flexDirection: 'column', gap: 2,
        overflowY: 'auto',
      }}>
        {/* Section label */}
        {!isCollapsed && (
          <div style={{
            fontSize: 10, fontWeight: 700, color: '#334155',
            letterSpacing: '1px', textTransform: 'uppercase',
            padding: '6px 12px 8px',
          }}>
            Menu
          </div>
        )}

        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href
          const link = (
            <SideNavLink
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              isActive={isActive}
              isCollapsed={isCollapsed}
              isLocked={item.locked}
            />
          )
          return isCollapsed
            ? <Tooltip key={item.href} content={item.label}><div>{link}</div></Tooltip>
            : <div key={item.href}>{link}</div>
        })}
      </div>

      {/* ── Student identity card ── */}
      <div style={{
        padding: '10px 8px',
        borderTop: '1px solid rgba(255,255,255,0.07)',
      }}>
        {isCollapsed ? (
          <Tooltip content={`${student.name} · ${LEVEL_LABEL[student.level]}`}>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0' }}>
              <AvatarCircle name={student.name} size={36} />
            </div>
          </Tooltip>
        ) : (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 10px', borderRadius: 10,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.06)',
            overflow: 'hidden',
          }}>
            <AvatarCircle name={student.name} size={34} />
            <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
              <div style={{
                fontSize: 13, fontWeight: 600, color: '#F1F5F9',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {student.name}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, color: '#818CF8',
                  background: 'rgba(99,102,241,0.18)', borderRadius: 4,
                  padding: '1px 6px', letterSpacing: '0.4px', textTransform: 'uppercase',
                }}>
                  {LEVEL_SHORT[student.level]}
                </span>
                <span style={{
                  fontSize: 10, color: '#F97316', fontWeight: 600,
                  background: 'rgba(249,115,22,0.15)', borderRadius: 4,
                  padding: '1px 6px',
                }}>
                  🔥 {student.streak}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Logout button — rendered below identity card */}
        <div style={{ marginTop: isCollapsed ? 4 : 8 }}>
          <LogoutButton collapsed={isCollapsed} />
        </div>
      </div>

      {/* ── Collapse toggle ── */}
      {isMounted && (
        <button
          onClick={toggleCollapse}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            position: 'absolute', top: '50%', right: -12,
            transform: 'translateY(-50%)',
            width: 24, height: 24, borderRadius: '50%',
            background: '#1E293B',
            border: '1px solid rgba(255,255,255,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#94A3B8', cursor: 'pointer', zIndex: 50,
            transition: 'background 150ms ease, color 150ms ease',
            boxShadow: '0 2px 8px rgba(0,0,0,0.30)',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#334155'; e.currentTarget.style.color = '#F1F5F9' }}
          onMouseLeave={e => { e.currentTarget.style.background = '#1E293B'; e.currentTarget.style.color = '#94A3B8' }}
        >
          {isCollapsed
            ? <ChevronRight size={13} strokeWidth={2.5} />
            : <ChevronLeft  size={13} strokeWidth={2.5} />
          }
        </button>
      )}
    </aside>
  )

  return (
    <>
      {mobileNav}
      {desktopNav}
    </>
  )
}
