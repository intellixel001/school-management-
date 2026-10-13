'use client'
import { ErrorState } from '@/components/ui'
export default function StudentsError({ reset }: { reset: () => void }) {
  return <ErrorState theme="light" title="Students unavailable" body="We couldn't load the student list. Please try again." primaryAction={{ label: 'Try again', onClick: reset }} secondaryAction={{ label: 'Refresh page', onClick: () => window.location.reload() }} />
}
