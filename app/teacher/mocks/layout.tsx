import type { Metadata } from 'next'

// The page is a client component and can't export metadata itself.
export const metadata: Metadata = {
  title: 'Manage Mocks — English AI Tutor',
  description: 'Control mock exam re-attempts for individual students.',
}

export default function MocksLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
