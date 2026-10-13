'use client'

import { forwardRef } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  children: React.ReactNode
}

// ─── Style maps ───────────────────────────────────────────────────────────────

const variantStyles: Record<ButtonVariant, string> = {
  primary: [
    'bg-[var(--accent-primary)] text-[var(--text-inverse)]',
    'hover:opacity-90',
    'border-transparent',
  ].join(' '),
  secondary: [
    'bg-transparent text-[var(--text-primary)]',
    'border border-[var(--border-default)]',
    'hover:bg-[var(--bg-surface-3)] hover:border-[var(--border-strong)]',
  ].join(' '),
  ghost: [
    'bg-transparent border-transparent text-[var(--text-secondary)]',
    'hover:bg-[var(--bg-surface-3)] hover:text-[var(--text-primary)]',
  ].join(' '),
  danger: [
    'bg-[color-mix(in_srgb,var(--accent-danger)_10%,transparent)]',
    'text-[var(--accent-danger)]',
    'border border-[color-mix(in_srgb,var(--accent-danger)_25%,transparent)]',
    'hover:bg-[color-mix(in_srgb,var(--accent-danger)_15%,transparent)]',
  ].join(' '),
  success: [
    'bg-[color-mix(in_srgb,var(--accent-success)_10%,transparent)]',
    'text-[var(--accent-success)]',
    'border border-[color-mix(in_srgb,var(--accent-success)_25%,transparent)]',
    'hover:bg-[color-mix(in_srgb,var(--accent-success)_15%,transparent)]',
  ].join(' '),
}

const sizeStyles: Record<ButtonSize, string> = {
  sm:  'px-3 py-1.5 text-[12px] rounded-[var(--radius-sm)] gap-1.5',
  md:  'px-4 py-2 text-[13px] rounded-[var(--radius-md)] gap-2',
  lg:  'px-5 py-2.5 text-[14px] rounded-[var(--radius-lg)] gap-2',
  xl:  'px-8 py-4 text-[16px] rounded-[var(--radius-lg)] gap-3 min-h-[64px]',
}

// ─── Component ────────────────────────────────────────────────────────────────

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        style={{
          transition: `background-color var(--transition-fast), border-color var(--transition-fast), color var(--transition-fast), transform var(--transition-base), box-shadow var(--transition-fast)`,
        }}
        className={[
          // Base
          'inline-flex items-center justify-center font-medium cursor-pointer',
          'border select-none outline-none',
          // Focus
          'focus-visible:ring-2 focus-visible:ring-offset-1',
          'focus-visible:shadow-[0_0_0_2px_var(--accent-primary)]',
          // Active
          'active:scale-[0.97]',
          // Disabled
          'disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none',
          // Variant + Size
          variantStyles[variant],
          sizeStyles[size],
          className,
        ].join(' ')}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin"
            style={{ width: 14, height: 14, color: 'currentColor' }}
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
