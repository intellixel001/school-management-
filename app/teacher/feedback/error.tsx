'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ErrorState from '@/components/ui/ErrorState'

export default function FeedbackError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    console.error('[teacher/feedback] route error', error)
  }, [error])

  return (
    <ErrorState
      theme="light"
      title="Something went wrong"
      body="We couldn't load the feedback page."
      primaryAction={{ label: 'Try again', onClick: reset }}
      secondaryAction={{ label: 'Back to dashboard', onClick: () => router.push('/teacher') }}
      errorCode={error.digest}
    />
  )
}
