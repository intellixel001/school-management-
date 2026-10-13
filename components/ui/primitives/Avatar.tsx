'use client'

import { forwardRef } from 'react'

export type AvatarVariant = 'initials' | 'icon'
export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl'

export interface AvatarProps {
  variant?: AvatarVariant
  size?: AvatarSize
  name?: string
  icon?: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

const PALETTE = [
  'color-mix(in srgb, var(--accent-primary) 15%, var(--bg-surface))',
  'color-mix(in srgb, var(--accent-success) 15%, var(--bg-surface))',
  'color-mix(in srgb, var(--accent-warning) 15%, var(--bg-surface))',
  'color-mix(in srgb, var(--accent-danger) 10%, var(--bg-surface))',
  'color-mix(in srgb, var(--accent-secondary) 12%, var(--bg-surface))',
  'color-mix(in srgb, var(--accent-neutral) 15%, var(--bg-surface))',
]

const TEXT_COLOURS = [
  'var(--accent-primary)',
  'var(--accent-success)',
  'var(--accent-warning)',
  'var(--accent-danger)',
  'var(--accent-secondary)',
  'var(--accent-neutral)',
]

function hashName(name: string): number {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return h % PALETTE.length
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const sizeMap: Record<AvatarSize, number> = { sm: 32, md: 40, lg: 56, xl: 80 }
const fontMap: Record<AvatarSize, number> = { sm: 12, md: 14, lg: 18, xl: 26 }

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ variant = 'initials', size = 'md', name = '', icon, className = '', style }, ref) => {
    const px = sizeMap[size]
    const fontSize = fontMap[size]
    const idx = hashName(name || 'User')
    return (
      <div
        ref={ref}
        role="img"
        aria-label={name || 'Avatar'}
        style={{
          width: px, height: px, minWidth: px, borderRadius: '50%',
          background: PALETTE[idx],
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 0 2px var(--border-default)',
          overflow: 'hidden', flexShrink: 0, ...style,
        }}
        className={className}
      >
        {variant === 'initials' ? (
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize, color: TEXT_COLOURS[idx], lineHeight: 1, letterSpacing: '-0.02em' }}>
            {getInitials(name)}
          </span>
        ) : (
          <span style={{ color: TEXT_COLOURS[idx], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {icon}
          </span>
        )}
      </div>
    )
  }
)
Avatar.displayName = 'Avatar'
