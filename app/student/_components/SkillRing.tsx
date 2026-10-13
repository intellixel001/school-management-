'use client'

import { LucideIcon } from 'lucide-react'

interface Props {
  label: string
  score: number              // 0-100
  color: string              // hex, e.g. '#6366F1'
  gradFrom: string           // gradient start
  gradTo: string             // gradient end
  Icon: LucideIcon
  size?: number              // default 84
  strokeWidth?: number       // default 8
}

export function SkillRing({
  label, score, color, gradFrom, gradTo, Icon,
  size = 84, strokeWidth = 8,
}: Props) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const gradId = `grad-${label.toLowerCase()}`

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
      padding: '4px 0',
    }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={gradFrom} />
              <stop offset="100%" stopColor={gradTo} />
            </linearGradient>
          </defs>
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#F1F5F9"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={`url(#${gradId})`}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              transition: 'stroke-dashoffset 800ms cubic-bezier(0.4, 0, 0.2, 1)',
              filter: `drop-shadow(0 0 6px ${color}40)`,
            }}
          />
        </svg>
        {/* Center number */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 2,
        }}>
          <Icon size={14} color={color} strokeWidth={2.2} />
          <span style={{
            fontSize: 18, fontWeight: 800, color: '#0F172A',
            fontFamily: 'var(--font-mono)', lineHeight: 1,
          }}>
            {score}
          </span>
        </div>
      </div>
      <span style={{
        fontSize: 12, fontWeight: 600, color: '#475569',
      }}>
        {label}
      </span>
    </div>
  )
}
