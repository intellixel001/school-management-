import type { TransitionKind } from '@/lib/transitions/types'

export interface ModeConfig {
  id: 'practice' | 'mock' | 'voice'
  title: string
  accent: string
  href: string
  transitionKind: TransitionKind
  objectUrl: string
  objectAspect: number
  /** Scale multiplier applied on top of the default vitrine size. 1 = default. */
  objectScale?: number
  /** Static rotation in degrees. Idle motion adds to this. */
  objectRotate?: number
  teaser: string
  description: string
  facts: { label: string; value: string }[]
}

export const MODES_CONFIG: ModeConfig[] = [
  {
    id: 'practice',
    title: 'Practice',
    accent: '#E8B96C',
    href: '/kiosk/practice',
    transitionKind: 'menu-to-practice',
    // Reuses the homepage open-book render — landscape aspect (~1.23:1).
    objectUrl: 'https://res.cloudinary.com/dvvcwzp4n/image/upload/v1783990634/open-book_ppon9g.webp',
    objectAspect: 1.23,
    objectScale: 1.1,
    teaser: 'Short drills with instant AI feedback',
    description: 'Pick one skill and work through a short set of questions. Your AI tutor marks each answer and explains what to fix.',
    facts: [
      { label: 'Skills', value: 'Reading, Writing, Listening, Speaking' },
      { label: 'Length', value: 'About 5 minutes' },
      { label: 'Points', value: '5 per correct answer, up to 25' },
    ]
  },
  {
    id: 'mock',
    title: 'Mock Test',
    accent: '#B5544A',
    href: '/kiosk/mock',
    transitionKind: 'menu-to-mock',
    objectUrl: 'https://res.cloudinary.com/dvvcwzp4n/image/upload/v1784180384/hourglass_trag4o.webp',
    objectAspect: 0.6,
    // Sits smaller and slightly tilted so the hourglass reads as a "found object"
    // in the vitrine rather than dominating it.
    objectScale: 0.7,
    objectRotate: -8,
    teaser: 'A full timed paper under exam conditions',
    description: 'A complete practice paper, timed like the real thing. Your tutor reviews it afterwards and writes you a full report.',
    facts: [
      { label: 'Format', value: 'Full timed paper' },
      { label: 'Marking', value: 'Reviewed by your tutor' },
      { label: 'Points', value: 'None — assessment only' },
    ]
  },
  {
    id: 'voice',
    title: 'AI Voice Tutor',
    accent: '#7C9BD9',
    href: '/kiosk/voice',
    transitionKind: 'menu-to-voice',
    objectUrl: 'https://res.cloudinary.com/dvvcwzp4n/image/upload/v1784181477/amber-bot_tszofc.webp',
    objectAspect: 1290 / 2018,
    objectScale: 0.85,
    teaser: 'An open conversation with your AI tutor',
    description: 'Talk to your AI tutor about anything you like. Tap the microphone, speak naturally, and it replies out loud at your level.',
    facts: [
      { label: 'Format', value: 'Tap the microphone and speak' },
      { label: 'Adapts to', value: 'Your level' },
      { label: 'Points', value: 'None' },
    ]
  }
]
