'use client'

import ErrorState from '@/components/ui/ErrorState'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body>
        <ErrorState
          theme="light"
          title="Something went wrong"
          body="The app encountered an unexpected error. Try again or refresh the page."
          primaryAction={{ label: 'Try again', onClick: reset }}
          secondaryAction={{ label: 'Refresh page', onClick: () => window.location.reload() }}
          errorCode={error.digest}
        />
      </body>
    </html>
  )
}
