'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui'
import KioskAuthModal from '@/components/KioskAuthModal'

export default function Home() {
  const router = useRouter()
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  function handleKioskClick(e: React.MouseEvent) {
    e.preventDefault()
    if (typeof window !== 'undefined' && sessionStorage.getItem('kiosk_authorized') === 'true') {
      router.push('/kiosk')
    } else {
      setIsAuthModalOpen(true)
    }
  }

  function handleAuthSuccess() {
    setIsAuthModalOpen(false)
    router.push('/kiosk')
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-2">
          <span className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[var(--accent-primary)] bg-[var(--accent-tint)] rounded-full">
            <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-pulse" />
            Dev Mode
          </span>
          <h1 className="text-3xl font-bold font-display text-[var(--text-primary)]">
            Portal Switcher
          </h1>
          <p className="text-[var(--text-secondary)]">
            Select an environment to preview
          </p>
        </div>

        <div className="grid gap-4">
          <button
            type="button"
            onClick={handleKioskClick}
            className="block text-left w-full outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--accent-primary)] rounded-[var(--radius-md)] cursor-pointer"
          >
            <Card hover className="p-6 border-[var(--border-default)] group">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors flex items-center gap-2">
                    Kiosk Portal
                    <span className="text-xs px-2 py-0.5 rounded bg-[var(--bg-subtle)] text-[var(--text-muted)] border border-[var(--border-default)] font-mono font-normal">
                      🔒 PIN Required
                    </span>
                  </h2>
                  <p className="text-sm text-[var(--text-muted)] mt-1">
                    Student interface for physical kiosks
                  </p>
                </div>
                <svg className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--accent-primary)] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Card>
          </button>

          <Link href="/student" className="block outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--accent-primary)] rounded-[var(--radius-md)]">
            <Card hover className="p-6 border-[var(--border-default)] group">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">
                    Student Dashboard
                  </h2>
                  <p className="text-sm text-[var(--text-muted)] mt-1">
                    Web app for enrolled learners
                  </p>
                </div>
                <svg className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--accent-primary)] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Card>
          </Link>

          <Link href="/teacher" className="block outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--accent-primary)] rounded-[var(--radius-md)]">
            <Card hover className="p-6 border-[var(--border-default)] group">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">
                    Teacher Dashboard
                  </h2>
                  <p className="text-sm text-[var(--text-muted)] mt-1">
                    Management and grading interface
                  </p>
                </div>
                <svg className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--accent-primary)] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Card>
          </Link>
        </div>
      </div>

      <KioskAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  )
}
