import type { Metadata } from 'next'

// The pages under /teacher/review are client components, so they can't export
// metadata themselves. This passthrough layout supplies the title for both the
// queue and the individual attempt pages.
export const metadata: Metadata = {
  title: 'Mock Reviews — English AI Tutor',
  description: 'Review and score submitted mock exam sections.',
}

export default function ReviewLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
