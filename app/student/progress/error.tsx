'use client'
import { ErrorState } from '@/components/ui'
export default function ProgressError({ reset }: { reset: () => void }) {
  return <ErrorState theme="light" title="Progress unavailable" body="We couldn't load your progress data. Please try again." primaryAction={{ label: 'Try again', onClick: reset }} secondaryAction={{ label: 'Refresh page', onClick: () => window.location.reload() }} />
}
