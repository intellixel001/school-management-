'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ErrorState from '@/components/ui/ErrorState'

export default function StudentDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    console.error('[teacher/students/[id]] route error', error)
  }, [error])

  return (
    <ErrorState
      theme="light"
      title="Something went wrong"
      body="We couldn't load this student."
      primaryAction={{ label: 'Try again', onClick: reset }}
      secondaryAction={{ label: 'Back to students', onClick: () => router.push('/teacher/students') }}
      errorCode={error.digest}
    />
  )
}
