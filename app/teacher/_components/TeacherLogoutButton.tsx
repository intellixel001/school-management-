'use client'

import { LogOut } from 'lucide-react'
import { useTeacherSession } from './TeacherSessionProvider'

export function TeacherLogoutButton({ collapsed = false }: { collapsed?: boolean }) {
  const { session, logout } = useTeacherSession()
  if (!session) return null

  return (
    <button
      onClick={logout}
      title={`Signed in as ${session.email}`}
      style={{
        display: 'inline-flex', alignItems: 'center',
        gap: collapsed ? 0 : 8, justifyContent: collapsed ? 'center' : 'flex-start',
        padding: collapsed ? '10px 0' : '8px 12px',
        borderRadius: 8,
        border: 'none', background: 'transparent',
        color: '#64748B', fontSize: 13, fontWeight: 600,
        cursor: 'pointer', width: '100%',
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
      <LogOut size={16} strokeWidth={2} />
      {!collapsed && <span>Sign out</span>}
    </button>
  )
}
