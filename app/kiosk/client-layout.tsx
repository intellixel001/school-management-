'use client'

import { useEffect } from 'react'
import PageTransition from './_components/PageTransition'
import { TransitionProvider } from './_components/TransitionProvider'
import TransitionOverlay from './_components/TransitionOverlay'
import { KioskSessionProvider } from './_components/KioskSessionProvider'
import { kioskAudio } from '@/lib/kiosk/audio'

export default function ClientKioskLayout({ children }: { children: React.ReactNode }) {
  // Preload the audio pools once — a single init survives navigation between
  // /kiosk, /kiosk/menu, and /kiosk/practice pages.
  useEffect(() => { kioskAudio.init() }, [])

  return (
    <KioskSessionProvider>
      <div
        data-portal="kiosk"
        style={{
          width: '100vw',
          height: '100dvh',
          overflow: 'hidden',
          fontSize: 18,
          cursor: 'default',
          background: '#120A08',
        }}
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
      >
        <TransitionProvider>
          <TransitionOverlay />
          <PageTransition>{children}</PageTransition>
        </TransitionProvider>
      </div>
    </KioskSessionProvider>
  )
}

