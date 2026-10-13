'use client'

import { usePathname, useRouter } from 'next/navigation'
import ErrorState from '@/components/ui/ErrorState'

export default function NotFound() {
  const pathname = usePathname()
  const router = useRouter()

  const isKiosk = pathname?.startsWith('/kiosk')
  const isStudent = pathname?.startsWith('/student')
  const isTeacher = pathname?.startsWith('/teacher')

  if (isKiosk) {
    return (
      <ErrorState
        theme="dark"
        title="Page not found"
        body="We couldn't find what you were looking for. Tap to return to the welcome screen."
        primaryAction={{ label: 'Return to welcome', onClick: () => router.push('/kiosk') }}
      />
    )
  }

  if (isStudent) {
    return (
      <ErrorState
        theme="light"
        title="Page not found"
        body="The page you're looking for doesn't exist or has been moved."
        primaryAction={{ label: 'Go to dashboard', onClick: () => router.push('/student') }}
        secondaryAction={{ label: 'Sign in again', onClick: () => router.push('/student/login') }}
      />
    )
  }

  if (isTeacher) {
    return (
      <ErrorState
        theme="light"
        title="Page not found"
        body="The page you're looking for doesn't exist or has been moved."
        primaryAction={{ label: 'Go to teacher dashboard', onClick: () => router.push('/teacher') }}
      />
    )
  }

  // Generic / unknown portal
  return (
    <ErrorState
      theme="light"
      title="Page not found"
      body="The page you're looking for doesn't exist. Choose where you'd like to go:"
      primaryAction={{ label: 'Student dashboard', onClick: () => router.push('/student') }}
      secondaryAction={{ label: 'Kiosk', onClick: () => router.push('/kiosk') }}
    />
  )
}
