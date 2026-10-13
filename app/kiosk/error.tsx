'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ErrorState from '@/components/ui/ErrorState'

export default function KioskError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  // Log to console for dev visibility. Production: Vercel / hosting captures.
  useEffect(() => {
    console.error('[kiosk] route error', error)
  }, [error])

  function handleRestart() {
    try {
      localStorage.removeItem('kiosk_session')
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
    } catch {}
    reset()                       // first try resetting the error boundary
    router.replace('/kiosk')      // then route back to PIN page as a hard reset
  }

  return (
    <div onClick={handleRestart} style={{ minHeight: '100dvh', cursor: 'pointer' }}>
      <ErrorState
        theme="dark"
        title="Something went wrong"
        body="Don't worry — tap anywhere to restart. The kiosk will reset itself shortly if no one touches it."
        primaryAction={{ label: 'Tap to restart', onClick: handleRestart }}
        autoRecoverMs={30_000}        // auto-restart after 30s of inactivity
        errorCode={error.digest}
      />
    </div>
  )
}
