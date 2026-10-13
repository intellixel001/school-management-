import { BookOpen, PenLine, Mic2, Headphones } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { SkillArea } from '@/types/platform'

export interface SkillConfig {
  label: string
  description: string
  icon: LucideIcon
  iconBg: string
  iconColor: string
  instruction: string
}

export const SKILL_CONFIG: Record<SkillArea, SkillConfig> = {
  reading: {
    label: 'Reading',
    description: 'Comprehension & vocabulary',
    icon: BookOpen,
    iconBg: 'rgba(0,102,204,0.10)',
    iconColor: 'var(--accent-primary)',
    instruction:
      'The AI tutor will present a short passage and ask you questions. Take your time reading before you respond.',
  },
  writing: {
    label: 'Writing',
    description: 'Grammar & sentence structure',
    icon: PenLine,
    iconBg: 'rgba(5,150,105,0.10)',
    iconColor: 'var(--accent-success)',
    instruction:
      'The AI tutor will give you short writing tasks. Type or speak your answers. Focus on grammar and structure.',
  },
  speaking: {
    label: 'Speaking',
    description: 'Conversation & pronunciation',
    icon: Mic2,
    iconBg: 'rgba(217,119,6,0.10)',
    iconColor: 'var(--accent-warning)',
    instruction:
      'Tap the microphone or hold the spacebar to speak clearly. The AI tutor will listen and give you feedback on your response.',
  },
  listening: {
    label: 'Listening',
    description: 'Audio comprehension & response',
    icon: Headphones,
    iconBg: 'rgba(107,114,128,0.10)',
    iconColor: 'var(--text-secondary)',
    instruction:
      'The AI tutor will read a passage aloud. Listen carefully, then answer the questions that follow.',
  },
}

/** Ordered list for rendering the 2×2 grid */
export const SKILL_ORDER: SkillArea[] = ['reading', 'writing', 'speaking', 'listening']

/** Stagger delays (ms) for mount animation */
export const SKILL_ANIMATION_DELAYS: Record<SkillArea, number> = {
  reading: 0,
  writing: 80,
  speaking: 160,
  listening: 240,
}
