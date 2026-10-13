'use client'
import { ErrorState } from '@/components/ui'
export default function PracticeError({ reset }: { reset: () => void }) {
  return <ErrorState theme="light" title="Practice unavailable" body="We couldn't load this practice session. Please try again." primaryAction={{ label: 'Try again', onClick: reset }} secondaryAction={{ label: 'Refresh page', onClick: () => window.location.reload() }} />
}
