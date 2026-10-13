'use client'

/**
 * @file components/ui/primitives/BlueBackButton.tsx
 * @description Reusable "back" pill button with the blue accent styling.
 *
 * Design tokens are hard-coded to the platform's primary blue so the button
 * looks identical across every page that uses it. Import and drop in wherever
 * a large touch-friendly back action is needed.
 *
 *   <BlueBackButton onClick={() => router.back()} />
 *   <BlueBackButton label="Back to menu" onClick={handleBack} />
 *   <BlueBackButton onClick={goBack} variant="filled" />
 *
 * The DOM element carries the class name `blue-back-btn` so the styling can
 * be located quickly in DevTools.
 */

import { forwardRef } from 'react'
import { ArrowLeft } from 'lucide-react'

export interface BlueBackButtonProps {
  onClick?: () => void
  /** Displayed to the right of the arrow. Defaults to "Back". */
  label?: string
  /** Native button type. Defaults to "button". */
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  className?: string
  style?: React.CSSProperties
  ariaLabel?: string
}

// Matched to the "Start Session" CTA so the two share a language.
const ACCENT = '#1E5FE3'

export const BlueBackButton = forwardRef<HTMLButtonElement, BlueBackButtonProps>(
  ({
    onClick,
    label = 'Back',
    type = 'button',
    disabled = false,
    className = '',
    style,
    ariaLabel,
  }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        onClick={onClick}
        disabled={disabled}
        aria-label={ariaLabel ?? label}
        className={`blue-back-btn ${className}`.trim()}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 12,
          padding: '0 28px',
          height: 68,
          borderRadius: 16,
          border: '1px solid transparent',
          background: ACCENT,
          color: '#FFFFFF',
          boxShadow: '0 6px 16px rgba(30, 95, 227, 0.28)',
          fontFamily: 'var(--font-display), sans-serif',
          fontWeight: 700,
          fontSize: 22,
          letterSpacing: '-0.005em',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.55 : 1,
          outline: 'none',
          // Only a tiny press feedback — no hover state, no color change.
          // Kiosk is a touch screen, so hover styling would just be noise on
          // a stylus/finger tap and can even trigger sticky :hover on some
          // Android WebViews.
          transition: 'transform 80ms ease',
          ...style,
        }}
        onPointerDown={(e) => { if (!disabled) e.currentTarget.style.transform = 'scale(0.97)' }}
        onPointerUp={(e)   => { e.currentTarget.style.transform = 'scale(1)' }}
        onPointerCancel={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
        onPointerLeave={(e)  => { e.currentTarget.style.transform = 'scale(1)' }}
      >
        <ArrowLeft size={26} strokeWidth={2.4} />
        <span>{label}</span>
      </button>
    )
  }
)
BlueBackButton.displayName = 'BlueBackButton'
