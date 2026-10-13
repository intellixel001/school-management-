'use client'

import { LogOut } from 'lucide-react'
import { useStudentSession } from '../../student/_components/StudentSessionProvider'

export function LogoutButton({ collapsed = false }: { collapsed?: boolean }) {
  const { logout, session } = useStudentSession()
  if (!session) return null

  return (
    <button
      onClick={logout}
      title={`Logged in as ${session.email}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: collapsed ? 0 : 6,
        justifyContent: collapsed ? 'center' : 'flex-start',
        padding: collapsed ? '10px 0' : '6px 10px',
        borderRadius: 8,
        border: 'none',
        background: 'transparent',
        color: '#64748B',
        fontSize: 12,
        fontWeight: 600,
        cursor: 'pointer',
        width: '100%',
        transition: 'background 150ms ease, color 150ms ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'rgba(239,68,68,0.10)'
        e.currentTarget.style.color = '#EF4444'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'transparent'
        e.currentTarget.style.color = '#64748B'
      }}
    >
      <LogOut size={14} strokeWidth={2} />
      {!collapsed && <span>Sign out</span>}
    </button>
  )
}
