'use client'

import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { TeacherSessionProvider } from './TeacherSessionProvider'
import RequireTeacherAuth from './RequireTeacherAuth'
import { TeacherNav } from '@/components/nav'
import { useTeacherSession } from './TeacherSessionProvider'
import { getPendingPracticeFeedback, getPendingStudents } from '@/lib/services'

export function TeacherLayoutShell({ children }: { children: React.ReactNode }) {
  return (
    <TeacherSessionProvider>
      <ChromeOrChildren>{children}</ChromeOrChildren>
    </TeacherSessionProvider>
  )
}

function ChromeOrChildren({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Login page: render bare, no chrome.
  if (pathname === '/teacher/login') {
    return <>{children}</>
  }

  return (
    <RequireTeacherAuth>
      <AuthedChrome>{children}</AuthedChrome>
    </RequireTeacherAuth>
  )
}

function AuthedChrome({ children }: { children: React.ReactNode }) {
  const { session } = useTeacherSession()
  const pathname = usePathname()

  const teacher = session
    ? { name: 'Korani Begum', pendingReviews: session.pendingReviews ?? 0 } // TEMP HARD-CODED for demo; restore: name: session.name
    : { name: 'Teacher', pendingReviews: 0 }

  // Pending practice count for the nav badge.
  // Uses the service function so we get consistent filtering + a single source
  // of truth. When backend lands, this becomes a real GET /api/sessions/pending-feedback
  // fetch with no changes needed here.
  const [pendingPracticeFeedback, setPendingPracticeFeedback] = useState(0)
  useEffect(() => {
    let cancelled = false
    getPendingPracticeFeedback()
      .then(sessions => { if (!cancelled) setPendingPracticeFeedback(sessions.length) })
      .catch(() => { if (!cancelled) setPendingPracticeFeedback(0) })
    return () => { cancelled = true }
  }, [])

  // Accounts awaiting approval — badges the "Approve Students" nav link.
  // Re-read on navigation so the badge clears once the queue is worked through.
  const [pendingApprovals, setPendingApprovals] = useState(0)
  useEffect(() => {
    let cancelled = false
    getPendingStudents()
      .then(list => { if (!cancelled) setPendingApprovals(list.length) })
      .catch(() => { if (!cancelled) setPendingApprovals(0) })
    return () => { cancelled = true }
  }, [pathname])

  return (
    <div
      data-portal="teacher"
      style={{
        height: '100dvh',
        overflow: 'hidden',
        background: 'var(--bg-base)',
        color: 'var(--text-primary)',
        display: 'flex',
        flexDirection: 'row',
      }}
    >
      <TeacherNav
        teacher={teacher}
        pendingPracticeFeedback={pendingPracticeFeedback}
        pendingApprovals={pendingApprovals}
      />
      <main className="flex-1 overflow-y-auto px-4 py-5 md:px-8 md:py-7 pb-20 md:pb-7 flex flex-col">
        {children}
      </main>
    </div>
  )
}
