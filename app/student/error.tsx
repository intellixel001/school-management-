'use client'
import { ErrorState } from '@/components/ui'

export default function StudentError({ reset }: { reset: () => void }) {
  return <ErrorState theme="light" title="Dashboard unavailable" body="We couldn't load your dashboard. Please try again." primaryAction={{ label: 'Try again', onClick: reset }} secondaryAction={{ label: 'Refresh page', onClick: () => window.location.reload() }} />
}
