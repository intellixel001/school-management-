'use client'

import { forwardRef } from 'react'

export interface SkeletonProps {
  width?: string | number
  height?: string | number
  borderRadius?: string | number
  className?: string
  style?: React.CSSProperties
}

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ width = '100%', height = 16, borderRadius = 'var(--radius-md)', className = '', style }, ref) => {
    return (
      <div
        ref={ref}
        aria-hidden="true"
        className={`skeleton-shimmer ${className}`}
        style={{
          width,
          height,
          borderRadius,
          background: 'var(--bg-surface-3)',
          overflow: 'hidden',
          flexShrink: 0,
          ...style,
        }}
      />
    )
  }
)
Skeleton.displayName = 'Skeleton'
