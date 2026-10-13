'use client'

import { LucideIcon } from 'lucide-react'

interface Props {
  Icon: LucideIcon
  color: string       // hex like '#6366F1'
  tintBg: string      // rgba like 'rgba(99,102,241,0.10)'
}

/**
 * Wraps a lucide icon in a tinted square with a subtle CSS pulse on hover.
 *
 * NOTE: The wrapper is intentionally swappable to a Lottie player later
 * without changing the call sites — same props (color + tintBg) will map.
 */
export function AnimatedStatIcon({ Icon, color, tintBg }: Props) {
  return (
    <div
      className="stat-icon-wrap"
      style={{
        width: 42, height: 42, borderRadius: 12,
        background: tintBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'transform 200ms ease, background 200ms ease',
      }}
    >
      <Icon size={20} color={color} strokeWidth={2.2} />
    </div>
  )
}
