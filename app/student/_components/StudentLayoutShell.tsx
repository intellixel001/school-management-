'use client'

import { usePathname } from 'next/navigation'
import { StudentSessionProvider } from './StudentSessionProvider'
import RequireStudentAuth from './RequireStudentAuth'
import { StudentNav } from '@/components/nav'

/**
 * Client-side shell for the student layout.
 * Wraps the entire subtree in the session provider + route guard.
 * Conditionally renders the dashboard chrome (nav + main padding) so the
 * login page renders clean — no sidebar, no nav chrome.
 */
export function StudentLayoutShell({ children }: { children: React.ReactNode }) {
  return (
    <StudentSessionProvider>
      <RequireStudentAuth>
        <ChromeOrChildren>{children}</ChromeOrChildren>
      </RequireStudentAuth>
    </StudentSessionProvider>
  )
}

function ChromeOrChildren({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Login & registration pages: no chrome, no nav — just the page itself.
  // These are public entry points; the dashboard sidebar would be confusing
  // and would imply an authenticated session that doesn't exist yet.
  if (pathname === '/student/login' || pathname.startsWith('/student/register')) {
    return <>{children}</>
  }

  // Authenticated pages: full dashboard chrome.
  return (
    <div
      data-portal="student"
      style={{
        height: '100dvh',
        overflow: 'hidden',
        background: 'var(--bg-base)',
        color: 'var(--text-primary)',
        display: 'flex',
        flexDirection: 'row',
      }}
    >
      <StudentNav />
      <main className="flex-1 overflow-y-auto px-4 py-5 md:px-8 md:py-7 pb-32 md:pb-7 flex flex-col">
        {children}
      </main>
    </div>
  )
}
