'use client'
import { ErrorState } from '@/components/ui'
export default function ReviewError({ reset }: { reset: () => void }) {
  return <ErrorState theme="light" title="Review queue unavailable" body="We couldn't load the review queue. Please try again." primaryAction={{ label: 'Try again', onClick: reset }} secondaryAction={{ label: 'Refresh page', onClick: () => window.location.reload() }} />
}
