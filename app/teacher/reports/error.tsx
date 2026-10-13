'use client'
import { ErrorState } from '@/components/ui'
export default function ReportsError({ reset }: { reset: () => void }) {
  return <ErrorState theme="light" title="Reports unavailable" body="We couldn't load the reports data. Please try again." primaryAction={{ label: 'Try again', onClick: reset }} secondaryAction={{ label: 'Refresh page', onClick: () => window.location.reload() }} />
}
