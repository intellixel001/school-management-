'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Spinner } from '@/components/ui'
import { ArrowLeft } from 'lucide-react'
import { getStudentById } from '@/lib/services'
import { useTransition } from '../_components/TransitionProvider'
import type { Student } from '@/types/platform'
import { gsap, prefersReducedMotion } from '@/lib/gsap'
import { LibraryScene } from '../_components/LibraryScene/LibraryScene'
import PracticeCard from './_components/PracticeCard'
import MenuHeader from '../menu/_components/MenuHeader'
import { getAssetsByType } from '@/lib/cosmicAssets'
import { LogOut } from 'lucide-react'
import { useKioskSession } from '../_components/KioskSessionProvider'

export default function KioskPracticePickerPage() {
  const router = useRouter()
  const { signalMounted } = useTransition()
  const { session: kioskSession, clear } = useKioskSession()
  const [student, setStudent] = useState<Student | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const mainRef = useRef<HTMLElement>(null)
  const headerContainerRef = useRef<HTMLDivElement>(null)

  // Signal to the transition overlay that we're ready to be revealed.
  // Fired only after the student has loaded (or a load error is set) so
  // the overlay never uncovers the page's own loading spinner.
  // requestAnimationFrame ensures the destination content has been painted
  // for at least one frame before the reveal starts.
  useEffect(() => {
    if (isLoading) return
    const id = requestAnimationFrame(() => signalMounted())
    return () => cancelAnimationFrame(id)
  }, [isLoading, signalMounted])

  useEffect(() => {
    if (!kioskSession) {
      router.replace('/kiosk')
      return
    }
    let cancelled = false
    async function load() {
      try {
        const s = await getStudentById(kioskSession!.studentId)
        if (!cancelled) {
          if (s) setStudent(s)
          else setError('Student not found')
        }
      } catch {
        if (!cancelled) {
          if (kioskSession?.studentId && kioskSession?.studentName) {
            setStudent({
              id: kioskSession.studentId,
              name: kioskSession.studentName,
              pin: '',
              email: kioskSession.email || '',
              level: kioskSession.level || 'entry-1',
              streak: 0,
              totalPoints: 0,
              completedSessions: 0,
              enrolledDate: '',
              lastActive: new Date().toISOString(),
              status: 'active',
              skills: { reading: 0, writing: 0, speaking: 0, listening: 0 },
              ilpTargets: [],
            })
          } else {
            setError('Failed to load student data')
          }
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [kioskSession, router])

  useEffect(() => {
    if (isLoading || error || !student || !mainRef.current || !headerContainerRef.current) return

    if (prefersReducedMotion()) {
      gsap.set('.practice-card', { opacity: 1, y: 0, scale: 1 })
      gsap.set('.accent-glow', { opacity: 0.45 })
      gsap.set('.card-robot', { opacity: 1, scale: 1 })
      gsap.set('.card-title, .card-subtitle, .card-caption', { opacity: 1 })
      return
    }

    const tl = gsap.timeline()

    // Cards wrapper
    tl.fromTo('.practice-card',
      { opacity: 0, y: 40, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: 'power3.out', stagger: 0.12 },
      0.0
    )

    // Accent glow
    tl.fromTo('.accent-glow',
      { opacity: 0 },
      { opacity: 0.45, duration: 0.6, stagger: 0.12 },
      0.5
    )

    // Robots
    tl.fromTo('.card-robot',
      { opacity: 0, scale: 0.92 },
      { opacity: 1, scale: 1, duration: 0.6, ease: 'power2.out', stagger: 0.12 },
      0.7
    )

    // Text
    tl.fromTo('.card-title, .card-subtitle, .card-caption',
      { opacity: 0 },
      { opacity: 1, duration: 0.6, ease: 'power2.out', stagger: { amount: 0.2, from: 'start' } },
      0.9
    )

  }, [isLoading, error, student])

  if (isLoading) {
    return (
      <div data-theme="dark" className="relative w-screen h-[100dvh] overflow-hidden bg-[var(--bg-base)]">
        <LibraryScene showProps={false} showParticles={false} />
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <Spinner size="lg" color="#E8B96C" />
        </div>
      </div>
    )
  }

  if (error || !student) {
    return (
      <div data-theme="dark" className="relative w-screen h-[100dvh] overflow-hidden bg-[var(--bg-base)]">
        <LibraryScene showProps={false} showParticles={false} />
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 gap-6 px-8 text-center">
          <div style={{ fontSize: 28 }}>⚠</div>
          <h2 className="font-display font-semibold" style={{ fontSize: 22, color: 'var(--text-primary)' }}>
            {error || 'Student not found'}
          </h2>
          <button
            onClick={() => {
              clear()
              router.replace('/kiosk')
            }}
            onPointerDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.94)'
              e.currentTarget.style.background = 'color-mix(in srgb, var(--accent-danger) 12%, transparent)'
            }}
            onPointerUp={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'
            }}
            onPointerLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'
            }}
            className="cursor-pointer outline-none select-none z-20"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              padding: '0 34px',
              height: 71,
              borderRadius: 15,
              border: '1px solid color-mix(in srgb, var(--accent-danger) 30%, transparent)',
              color: 'var(--accent-danger)',
              background: 'rgba(255, 255, 255, 0.04)',
              cursor: 'pointer',
              transition: 'transform 100ms ease, background 100ms ease',
              outline: 'none',
            }}
          >
            <LogOut size={26} />
            <span className="font-display font-bold text-white" style={{ fontSize: 24 }}>Return to Login</span>
          </button>
        </div>
      </div>
    )
  }

  const assets = getAssetsByType('mascot')
  const getAsset = (id: string) => assets.find(a => a.id === id)

  const readingBot = getAsset('ai-bot-reading')
  const writingBot = getAsset('ai-bot-writing')
  const listeningBot = getAsset('ai-bot-listening')
  const speakingBot = getAsset('ai-bot-speaking')

  // Fallback defaults if assets not loaded properly to prevent crash
  const def = { url: '', naturalAspect: 9/16 }

  return (
    <div
      data-theme="dark"
      className="relative w-screen h-[100dvh] overflow-hidden bg-[var(--bg-base)]"
    >
      <LibraryScene showProps={false} showParticles={false} />
      
      {/* Header renders at full opacity so the Logout + Back buttons are
          always clickable. The entrance animation still fades in the CARDS
          below — the header itself doesn't need to sneak in. */}
      <div ref={headerContainerRef}>
        <MenuHeader student={student} centerTitle="Choose your skill" hideWelcomePrefix={true} />
      </div>

      {/* Bottom-left back button */}
      <button
        onClick={() => router.push('/kiosk/menu')}
        onPointerDown={(e) => { e.currentTarget.style.transform = 'scale(0.94)' }}
        onPointerUp={(e)   => { e.currentTarget.style.transform = 'scale(1)' }}
        onPointerLeave={(e)=> { e.currentTarget.style.transform = 'scale(1)' }}
        aria-label="Back to main menu"
        className="absolute z-50 flex items-center justify-center"
        style={{
          bottom: 48,
          left: 48,
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '0 27px', height: 71,
          borderRadius: 15,
          border: '1px solid rgba(255,255,255,0.14)',
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(24px) saturate(140%)',
          WebkitBackdropFilter: 'blur(24px) saturate(140%)',
          color: 'var(--text-primary)',
          cursor: 'pointer', outline: 'none',
          transition: 'transform 100ms ease, background 100ms ease',
        }}
      >
        <ArrowLeft size={27} />
        <span className="font-display font-bold" style={{ fontSize: 24 }}>Back</span>
      </button>
      <main
        ref={mainRef}
        className="absolute inset-0 z-0 overflow-y-auto overflow-x-hidden flex flex-col pt-[80px]"
      >
        <div className="flex flex-col items-center w-full max-w-[1052px] mx-auto px-4 my-auto pt-8" style={{ gap: 28, paddingBottom: 80 }}>
          <PracticeCard 
            skill="reading"   
            accent="#E8B96C" 
            title="Reading"
            subtitle="Read short passages and answer questions with your AI tutor"
            assetSrc={(readingBot || def).url}
            assetIntrinsicWidth={1536}
            assetIntrinsicHeight={2778}
            href="/kiosk/practice/reading"
            index={0} 
          />
          <PracticeCard 
            skill="writing"   
            accent="#E8B96C" 
            title="Writing"
            subtitle="Write to a prompt, get feedback from your AI tutor"
            assetSrc={(writingBot || def).url}
            assetIntrinsicWidth={1536}
            assetIntrinsicHeight={2742}
            href="/kiosk/practice/writing"
            index={1} 
          />
          <PracticeCard 
            skill="listening" 
            accent="#E8B96C" 
            title="Listening"
            subtitle="Listen to audio passages and answer comprehension questions"
            assetSrc={(listeningBot || def).url}
            assetIntrinsicWidth={1536}
            assetIntrinsicHeight={2778}
            href="/kiosk/practice/listening"
            index={2} 
          />
          <PracticeCard
            skill="speaking"
            accent="#E8B96C"
            title="Speaking"
            subtitle="Practice spoken responses and get instant feedback"
            assetSrc={(speakingBot || def).url}
            assetIntrinsicWidth={1536}
            assetIntrinsicHeight={2778}
            href="/kiosk/practice/speaking"
            index={3} 
          />
        </div>
      </main>
    </div>
  )
}
