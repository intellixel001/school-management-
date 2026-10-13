'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard, Users, ClipboardCheck, MessageSquare,
  TrendingUp, Settings, ChevronLeft, ChevronRight, PenSquare, UserCheck,
} from 'lucide-react'
import { Tooltip } from '@/components/ui'
import type { Teacher } from '@/types/platform'
import { TeacherLogoutButton } from '@/app/teacher/_components/TeacherLogoutButton'

// ── Design tokens ─────────────────────────────────────────────────────────────

const BG        = '#0A1628'
const ACCENT    = '#4D9FFF'
const ACCENT_DIM = 'rgba(77,159,255,0.10)'
const BORDER    = 'rgba(255,255,255,0.06)'
const TEXT_DIM  = '#475569'
const TEXT_MED  = '#64748B'
const TEXT_ON   = '#F1F5F9'

// ── Nav items ─────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Overview',          href: '/teacher' },
  { icon: Users,           label: 'Students',          href: '/teacher/students' },
  { icon: UserCheck,       label: 'Approve Students',  href: '/teacher/approvals' },
  { icon: PenSquare,       label: 'Practice Feedback', href: '/teacher/practice-feedback' },
  { icon: ClipboardCheck,  label: 'Mock Reviews',      href: '/teacher/review' },
  { icon: MessageSquare,   label: 'Review History',    href: '/teacher/feedback' },
  { icon: TrendingUp,      label: 'Reports',           href: '/teacher/reports' },
  { icon: Settings,        label: 'Manage Mocks',      href: '/teacher/mocks' },
]

const MOBILE_ITEMS = NAV_ITEMS.slice(0, 4)

// ── Props ─────────────────────────────────────────────────────────────────────

interface TeacherNavProps {
  teacher: Pick<Teacher, 'name' | 'pendingReviews'>
  pendingPracticeFeedback?: number
  /** Accounts awaiting teacher approval — badges the "Approve Students" link. */
  pendingApprovals?: number
}

// ── Component ─────────────────────────────────────────────────────────────────

export function TeacherNav({
  teacher,
  pendingPracticeFeedback = 0,
  pendingApprovals = 0,
}: TeacherNavProps) {
  const pathname    = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMounted,   setIsMounted]   = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true)
      const saved = localStorage.getItem('ec-teacher-nav-collapsed')
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
        const saved = localStorage.getItem('ec-teacher-nav-collapsed')
        if (saved !== 'true') setIsCollapsed(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => { clearTimeout(timer); window.removeEventListener('resize', handleResize) }
  }, [])

  const toggleCollapse = () => {
    const next = !isCollapsed
    setIsCollapsed(next)
    localStorage.setItem('ec-teacher-nav-collapsed', String(next))
  }

  const hasPending          = teacher.pendingReviews > 0
  const hasPracticePending  = pendingPracticeFeedback > 0
  const sidebarWidth = !isMounted ? 224 : isCollapsed ? 60 : 224
  const initials    = teacher.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  // ── Active-route resolver ─────────────────────────────────────────────────
  // Prefix match so detail pages keep their section lit — e.g.
  // /teacher/students/stu-005 highlights "Students". /teacher is exact-matched,
  // otherwise Overview would stay lit on every page.

  function isActiveHref(href: string): boolean {
    if (href === '/teacher') return pathname === '/teacher'
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  // ── Badge resolver — maps each nav href to its count ———————————————————

  function getBadgeCount(href: string): number | undefined {
    if (href === '/teacher/practice-feedback') return hasPracticePending ? pendingPracticeFeedback : undefined
    if (href === '/teacher/review') return hasPending ? teacher.pendingReviews : undefined
    if (href === '/teacher/approvals') return pendingApprovals > 0 ? pendingApprovals : undefined
    return undefined
  }

  // ── Mobile bottom bar ───────────────────────────────────────────────────────

  const mobileNav = (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex justify-between items-center px-2 pt-2"
      style={{
        background: BG,
        borderTop: `1px solid ${BORDER}`,
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
      }}
    >
      {MOBILE_ITEMS.map(item => {
        const isActive = isActiveHref(item.href)
        const badge    = getBadgeCount(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex-1 flex flex-col items-center justify-center gap-1 p-2 rounded-lg"
            style={{ color: isActive ? ACCENT : TEXT_DIM, textDecoration: 'none' }}
          >
            <span className="relative inline-flex">
              <item.icon size={20} strokeWidth={isActive ? 2 : 1.5} />
              {badge !== undefined && (
                <span
                  className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
                  style={{ background: '#EF4444', border: `1.5px solid ${BG}` }}
                />
              )}
            </span>
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
        background: BG,
        borderRight: `1px solid ${BORDER}`,
        transition: 'width 320ms cubic-bezier(0.4,0,0.2,1)',
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      {/* ── Logo ─────────────────────────────────────────────────────────── */}
      <div style={{
        padding: '18px 12px 14px',
        borderBottom: `1px solid ${BORDER}`,
        overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 38 }}>
          {/* Logo mark */}
          <div style={{
            width: 34, height: 34, borderRadius: 10, flexShrink: 0,
            background: 'linear-gradient(135deg, #4D9FFF 0%, #0066CC 50%, #004FA3 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.5px',
            boxShadow: '0 4px 14px rgba(0,102,204,0.45)',
          }}>
            EC
          </div>

          {/* Brand text — fades when collapsed */}
          <div style={{
            overflow: 'hidden', whiteSpace: 'nowrap',
            opacity: isCollapsed ? 0 : 1,
            transition: 'opacity 250ms ease',
            minWidth: 0,
          }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: TEXT_ON, lineHeight: 1.2 }}>
              English AI Tutor
            </div>
            <div style={{
              fontSize: 10, color: ACCENT, fontWeight: 600,
              letterSpacing: '0.8px', textTransform: 'uppercase', marginTop: 1,
            }}>
              Teacher Portal
            </div>
          </div>
        </div>
      </div>

      {/* ── Nav links ────────────────────────────────────────────────────── */}
      <div style={{
        flex: 1, padding: '10px 8px',
        display: 'flex', flexDirection: 'column', gap: 2,
        overflowY: 'auto',
      }}>
        {NAV_ITEMS.map(item => {
          const isActive = isActiveHref(item.href)
          const badge    = getBadgeCount(item.href)

          const link = (
            <Link
              href={item.href}
              style={{
                display: 'flex', alignItems: 'center', height: 40,
                padding: '0 12px',
                borderRadius: 8, textDecoration: 'none',
                background: isActive ? ACCENT_DIM : 'transparent',
                borderLeft: `2px solid ${isActive ? ACCENT : 'transparent'}`,
                gap: 10, position: 'relative',
                transition: 'background 150ms ease, border-color 150ms ease',
              }}
              onMouseEnter={e => {
                if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
              }}
              onMouseLeave={e => {
                if (!isActive) e.currentTarget.style.background = 'transparent'
              }}
            >
              {/* Icon */}
              <div style={{ position: 'relative', flexShrink: 0, display: 'flex' }}>
                <item.icon
                  size={17}
                  strokeWidth={isActive ? 2 : 1.6}
                  style={{ color: isActive ? ACCENT : TEXT_DIM }}
                />
                {/* Collapsed badge dot */}
                {isCollapsed && badge && (
                  <span style={{
                    position: 'absolute', top: -3, right: -3,
                    width: 7, height: 7, borderRadius: '50%',
                    background: '#EF4444', border: `1.5px solid ${BG}`,
                  }} />
                )}
              </div>

              {/* Label + expanded badge */}
              {!isCollapsed && (
                <>
                  <span style={{
                    fontSize: 14, fontWeight: isActive ? 600 : 400,
                    color: isActive ? TEXT_ON : TEXT_MED,
                    flex: 1, whiteSpace: 'nowrap', overflow: 'hidden',
                    transition: 'opacity 300ms ease',
                  }}>
                    {item.label}
                  </span>
                  {badge && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, lineHeight: 1,
                      background: '#EF4444', color: '#FFFFFF',
                      borderRadius: 10, padding: '2px 6px', flexShrink: 0,
                    }}>
                      {badge}
                    </span>
                  )}
                </>
              )}
            </Link>
          )

          return isCollapsed
            ? (
              <Tooltip key={item.href} content={item.label}>
                <div>{link}</div>
              </Tooltip>
            )
            : <div key={item.href}>{link}</div>
        })}
      </div>

      {/* ── Collapse toggle — sits in the flow above the profile block, not
             pinned to the sidebar edge (the aside clips overflow). ─────────── */}
      {isMounted && (
        <div style={{
          padding: '6px 10px',
          display: 'flex',
          justifyContent: isCollapsed ? 'center' : 'flex-end',
        }}>
          <button
            onClick={toggleCollapse}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            style={{
              width: 26, height: 26, borderRadius: '50%',
              background: '#1E293B',
              border: '1px solid rgba(255,255,255,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#94A3B8', cursor: 'pointer', flexShrink: 0,
              transition: 'background 150ms ease, color 150ms ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#334155'
              e.currentTarget.style.color      = TEXT_ON
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '#1E293B'
              e.currentTarget.style.color      = '#94A3B8'
            }}
          >
            {isCollapsed
              ? <ChevronRight size={14} strokeWidth={2.5} />
              : <ChevronLeft  size={14} strokeWidth={2.5} />
            }
          </button>
        </div>
      )}

      {/* ── Footer: profile + logout ─────────────────────────────────────────── */}
      <div style={{
        padding: '12px 10px',
        borderTop: `1px solid ${BORDER}`,
        display: 'flex', flexDirection: 'column', gap: 6,
      }}>
        {/* Profile row */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 10px',
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #4D9FFF 0%, #2563EB 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, color: '#FFFFFF',
          }}>
            {initials}
          </div>
          {!isCollapsed && (
            <div style={{ minWidth: 0, overflow: 'hidden' }}>
              <div style={{
                fontSize: 13, fontWeight: 600, color: TEXT_ON,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {teacher.name}
              </div>
              <div style={{
                fontSize: 11, color: TEXT_MED,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                Teacher
              </div>
            </div>
          )}
        </div>

        {/* Logout */}
        <TeacherLogoutButton collapsed={isCollapsed} />
      </div>
    </aside>
  )

  return (
    <>
      {mobileNav}
      {desktopNav}
    </>
  )
}
