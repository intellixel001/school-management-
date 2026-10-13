import type { Metadata } from 'next'

// The report page is a client component and can't export metadata itself.
export const metadata: Metadata = {
  title: 'Mock Report — English AI Tutor',
  description: 'Published mock exam report for a student.',
}

export default function MockReportsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
