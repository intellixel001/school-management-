import type { Metadata } from 'next'
import { StudentLayoutShell } from './_components/StudentLayoutShell'

export const metadata: Metadata = {
  title: 'Student — English AI Tutor',
}

/**
 * Server component outer shell — keeps `metadata` export which requires a
 * server component. All client-side concerns (session provider, route guard,
 * nav chrome) live in StudentLayoutShell.
 */
export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <StudentLayoutShell>
      {children}
    </StudentLayoutShell>
  )
}
