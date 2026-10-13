'use client'

import { useCountUp } from '@/hooks/useCountUp'
import { Card } from '@/components/ui'

interface TeacherMetricCardProps {
  iconNode: React.ReactNode
  label: string
  value: number
  deltaNode?: React.ReactNode
  suffix?: string
  animationDelayMs: number
  borderColor?: string
  urgentBorder?: boolean
}

export function TeacherMetricCard({
  iconNode,
  label,
  value,
  deltaNode,
  suffix = '',
  animationDelayMs,
  borderColor,
  urgentBorder = false,
}: TeacherMetricCardProps) {
  const animatedValue = useCountUp(value, 600)

  const resolvedBorderColor = borderColor ?? (urgentBorder ? 'var(--accent-warning)' : undefined)

  return (
    <Card
      variant="default"
      hover
      className="p-4 flex flex-col justify-between h-[106px] animate-[fadeSlideUp_300ms_ease-out_both] relative overflow-hidden"
      style={{
        animationDelay: `${animationDelayMs}ms`,
      }}
    >
      {resolvedBorderColor && (
        <div
          style={{
            position: 'absolute',
            left: 0, top: 0, bottom: 0,
            width: 3,
            background: resolvedBorderColor,
            borderRadius: '2px 0 0 2px',
          }}
        />
      )}

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
        {deltaNode && (
          <div className="font-body text-[12px] font-medium">
            {deltaNode}
          </div>
        )}
      </div>
    </Card>
  )
}
