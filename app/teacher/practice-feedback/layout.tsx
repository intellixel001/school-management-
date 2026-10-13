import type { Metadata } from 'next'

// Supplies the title for the [sessionId] detail page, which is a client
// component and can't export metadata. The queue page at this segment exports
// its own metadata, which takes precedence over this for that route.
export const metadata: Metadata = {
  title: 'Practice Feedback — English AI Tutor',
  description: 'Give feedback on completed practice sessions.',
}

export default function PracticeFeedbackLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
