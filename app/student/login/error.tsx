'use client'

import { useEffect } from 'react'
import ErrorState from '@/components/ui/ErrorState'

export default function LoginError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[student/login] route error', error)
  }, [error])

  return (
    <ErrorState
      theme="light"
      title="Something went wrong"
      body="We couldn't load the sign-in page. Try again or refresh."
      primaryAction={{ label: 'Try again', onClick: reset }}
      secondaryAction={{ label: 'Refresh page', onClick: () => window.location.reload() }}
      errorCode={error.digest}
    />
  )
}
