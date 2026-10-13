'use client'

import { forwardRef, useState, useRef, useCallback, useEffect } from 'react'

export interface TooltipProps {
  content: React.ReactNode
  children: React.ReactNode
  delay?: number
  className?: string
}

export const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(
  ({ content, children, delay = 120, className = '' }, ref) => {
    const [visible, setVisible] = useState(false)
    const [pos, setPos] = useState<'top' | 'bottom'>('top')
    const wrapRef = useRef<HTMLDivElement>(null)
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const show = useCallback(() => {
      timerRef.current = setTimeout(() => {
        if (wrapRef.current) {
          const rect = wrapRef.current.getBoundingClientRect()
          setPos(rect.top < 80 ? 'bottom' : 'top')
        }
        setVisible(true)
      }, delay)
    }, [delay])

    const hide = useCallback(() => {
      if (timerRef.current) clearTimeout(timerRef.current)
      setVisible(false)
    }, [])

    useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

    return (
      <div
        ref={(el) => {
          (wrapRef as React.MutableRefObject<HTMLDivElement | null>).current = el
          if (typeof ref === 'function') ref(el)
          else if (ref) ref.current = el
        }}
        style={{ position: 'relative', display: 'inline-flex' }}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        className={className}
      >
        {children}
        {visible && (
          <div
            role="tooltip"
            style={{
              position: 'absolute',
              ...(pos === 'top'
                ? { bottom: 'calc(100% + 8px)' }
                : { top: 'calc(100% + 8px)' }),
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'var(--accent-secondary)',
              color: 'var(--text-inverse)',
              borderRadius: 'var(--radius-sm)',
              padding: '5px 10px',
              fontSize: 12,
              fontFamily: 'var(--font-body)',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              zIndex: 9999,
              animation: 'fadeUp 120ms ease both',
              boxShadow: 'var(--shadow-float)',
            }}
          >
            {content}
            {/* Arrow */}
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 0,
                height: 0,
                ...(pos === 'top'
                  ? {
                      top: '100%',
                      borderLeft: '5px solid transparent',
                      borderRight: '5px solid transparent',
                      borderTop: '5px solid var(--accent-secondary)',
                    }
                  : {
                      bottom: '100%',
                      borderLeft: '5px solid transparent',
                      borderRight: '5px solid transparent',
                      borderBottom: '5px solid var(--accent-secondary)',
                    }),
              }}
            />
          </div>
        )}
      </div>
    )
  }
)
Tooltip.displayName = 'Tooltip'
