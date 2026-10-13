'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ErrorState from '@/components/ui/ErrorState'

export default function PracticeFeedbackError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    console.error('[teacher/practice-feedback] route error', error)
  }, [error])

  return (
    <ErrorState
      theme="light"
      title="Something went wrong"
      body="We couldn't load the practice feedback queue."
      primaryAction={{ label: 'Try again', onClick: reset }}
      secondaryAction={{ label: 'Back to dashboard', onClick: () => router.push('/teacher') }}
      errorCode={error.digest}
    />
  )
}
