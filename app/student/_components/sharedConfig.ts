import { BookOpen, PenLine, Mic2, Headphones } from 'lucide-react'

export const SKILL_CFG = {
  reading:   { label: 'Reading',   Icon: BookOpen,   color: '#6366F1', gradFrom: '#6366F1', gradTo: '#818CF8', bg: 'rgba(99,102,241,0.10)' },
  writing:   { label: 'Writing',   Icon: PenLine,    color: '#10B981', gradFrom: '#10B981', gradTo: '#34D399', bg: 'rgba(16,185,129,0.10)'  },
  speaking:  { label: 'Speaking',  Icon: Mic2,       color: '#F59E0B', gradFrom: '#F59E0B', gradTo: '#FCD34D', bg: 'rgba(245,158,11,0.10)' },
  listening: { label: 'Listening', Icon: Headphones, color: '#EC4899', gradFrom: '#EC4899', gradTo: '#F472B6', bg: 'rgba(236,72,153,0.10)' },
} as const

export type SkillKey = keyof typeof SKILL_CFG
