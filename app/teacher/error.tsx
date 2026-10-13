'use client'
import { ErrorState } from '@/components/ui'
import { clearTokens } from '@/lib/api/tokens'

export default function TeacherError({ reset }: { reset: () => void }) {
  function handleLogout() {
    // Session conflict is a common trigger for this error (e.g. after a dev-server
    // restart the local session references stale tokens). Clear session + tokens
    // and hard-navigate to login so the user gets a clean state.
    try {
      localStorage.removeItem('ec-teacher-session')
      clearTokens()
    } catch {}
    window.location.href = '/teacher/login'
  }

  // Fixed overlay hides the teacher nav sidebar underneath. The error boundary
  // renders inside the teacher layout, so without this the sidebar shows through.
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#FAFAFA',
    }}>
      <ErrorState
        theme="light"
        title="Dashboard unavailable"
        body="We couldn't load the teacher dashboard. This can happen after a session conflict. Try again, or log out and sign in fresh."
        primaryAction={{ label: 'Try again', onClick: reset }}
        secondaryAction={{ label: 'Log out', onClick: handleLogout, variant: 'danger' }}
      />
    </div>
  )
}
