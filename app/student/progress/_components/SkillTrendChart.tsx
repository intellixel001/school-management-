'use client'

import { SKILL_CONFIG } from '@/lib/skillConfig'
import { TrendChart } from '@/components/charts/TrendChart'
import type { SkillArea, Session } from '@/types/platform'

const SKILL_HEX: Record<SkillArea, string> = {
  reading:   '#6366F1',
  writing:   '#10B981',
  speaking:  '#F59E0B',
  listening: '#EC4899',
}

interface Props {
  skill:        SkillArea
  sessions:     Session[]
  currentScore: number
}

export function SkillTrendChart({ skill, sessions, currentScore }: Props) {
  const config = SKILL_CONFIG[skill]
  const hex    = SKILL_HEX[skill]

  const dataPoints = sessions
    .filter(s => s.skillArea === skill && s.status === 'completed')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-5)
    .map(s => ({ score: s.score, date: s.date }))

  return (
    <TrendChart
      title={config.label}
      currentScore={currentScore}
      accentColor={hex}
      hexColor={hex}
      dataPoints={dataPoints}
    />
  )
}
