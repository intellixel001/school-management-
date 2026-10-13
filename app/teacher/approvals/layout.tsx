import type { Metadata } from 'next'

// The page is a client component and can't export metadata itself.
export const metadata: Metadata = {
  title: 'Approve Students — English AI Tutor',
  description: 'Approve or reject new student account registrations.',
}

export default function ApprovalsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
