'use client'

import { Card } from '@/components/ui'
import { LucideIcon } from 'lucide-react'
import { useCountUp } from '@/hooks/useCountUp'

interface MetricCardProps {
  iconNode: React.ReactNode
  label: string
  value: number
  deltaStr: string
  deltaType: 'positive' | 'negative' | 'neutral'
  suffix?: string
  animationDelayMs: number
}

export function MetricCard({ iconNode, label, value, deltaStr, deltaType, suffix = '', animationDelayMs }: MetricCardProps) {
  const animatedValue = useCountUp(value, 600)

  const deltaColorClass = 
    deltaType === 'positive' ? 'text-[var(--accent-success)]' :
    deltaType === 'negative' ? 'text-[var(--accent-danger)]' :
    'text-[var(--text-muted)]'

  return (
    <Card 
      variant="default" 
      hover 
      className="p-4 flex flex-col justify-between h-[100px] animate-[fadeSlideUp_300ms_ease-out_both] group"
      style={{ animationDelay: `${animationDelayMs}ms` }}
    >
      <div className="flex items-center gap-2">
        {iconNode}
        <span className="font-body text-[11px] uppercase tracking-wide text-[var(--text-muted)] font-semibold">
          {label}
        </span>
      </div>
      <div className="flex items-baseline justify-between mt-auto">
        <div className="font-mono text-[28px] font-semibold text-[var(--text-primary)] leading-none">
          {animatedValue}{suffix}
        </div>
        <div className={`font-body text-[12px] font-medium ${deltaColorClass}`}>
          {deltaStr}
        </div>
      </div>
    </Card>
  )
}
