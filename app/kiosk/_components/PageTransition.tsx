'use client'

// Smooth fade + slide page transitions for the kiosk portal only.
// Wraps the {children} slot of the kiosk client layout. Each kiosk route
// (`/kiosk`, `/kiosk/menu`, `/kiosk/practice`, etc.) becomes a key for
// AnimatePresence so the OLD page exits before the NEW page enters,
// producing a premium "page swap" feel without leaving the SPA model.
//
// Student and Teacher portals are untouched — no Motion overhead there.

import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import { useTransition } from './TransitionProvider'

const TRANSITION = {
  duration: 0.45,
  ease: [0.22, 1, 0.36, 1] as const, // gentle ease-out cubic — feels expensive
}

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { inFlightTransition } = useTransition()

  // If a custom transition is active, bypass motion completely to avoid clashing
  const isCustomTransition = inFlightTransition !== null

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={isCustomTransition ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 24, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={isCustomTransition ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: -16, scale: 0.99 }}
        transition={isCustomTransition ? { duration: 0 } : TRANSITION}
        style={{ width: '100%', height: '100%' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
