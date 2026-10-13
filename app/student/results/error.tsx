'use client'
import { ErrorState } from '@/components/ui'
export default function ResultsError({ reset }: { reset: () => void }) {
  return <ErrorState theme="light" title="Results unavailable" body="We couldn't load your session results. Please try again." primaryAction={{ label: 'Try again', onClick: reset }} secondaryAction={{ label: 'Refresh page', onClick: () => window.location.reload() }} />
}
