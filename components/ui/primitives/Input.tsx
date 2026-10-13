'use client'

import { forwardRef, useRef, useCallback } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

export type InputType = 'text' | 'password' | 'number' | 'pin'

interface BaseInputProps {
  label?: string
  error?: string
  helperText?: string
}

export interface TextInputProps
  extends BaseInputProps,
    Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  type?: 'text' | 'password' | 'number'
}

export interface PinInputProps extends BaseInputProps {
  type: 'pin'
  digits?: 4 | 6
  value?: string
  onChange?: (value: string) => void
  onComplete?: (value: string) => void
  onScreenKeyboard?: boolean
}

export type InputProps = TextInputProps | PinInputProps

// ─── Standard text/password/number input ─────────────────────────────────────

const StandardInput = forwardRef<HTMLInputElement, TextInputProps>(
  ({ label, error, helperText, type = 'text', className = '', style, ...props }, ref) => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {label && (
          <label
            style={{
              fontSize: 11,
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              letterSpacing: '0.07em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
            }}
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          type={type}
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            padding: '10px 12px',
            borderRadius: 'var(--radius-md)',
            border: `1px solid ${error ? 'var(--accent-danger)' : 'var(--border-default)'}`,
            background: 'var(--bg-surface-2)',
            color: 'var(--text-primary)',
            outline: 'none',
            transition: `border-color var(--transition-fast), box-shadow var(--transition-fast)`,
            boxShadow: error ? '0 0 0 3px color-mix(in srgb, var(--accent-danger) 15%, transparent)' : 'none',
            width: '100%',
            ...style,
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = error ? 'var(--accent-danger)' : 'var(--accent-primary)'
            e.currentTarget.style.boxShadow = error
              ? '0 0 0 3px color-mix(in srgb, var(--accent-danger) 15%, transparent)'
              : 'var(--shadow-glow)'
            props.onFocus?.(e)
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = error ? 'var(--accent-danger)' : 'var(--border-default)'
            e.currentTarget.style.boxShadow = error
              ? '0 0 0 3px color-mix(in srgb, var(--accent-danger) 15%, transparent)'
              : 'none'
            props.onBlur?.(e)
          }}
          className={className}
          {...props}
        />
        {(error || helperText) && (
          <span
            style={{
              fontSize: 12,
              color: error ? 'var(--accent-danger)' : 'var(--text-muted)',
            }}
          >
            {error ?? helperText}
          </span>
        )}
      </div>
    )
  }
)
StandardInput.displayName = 'StandardInput'

// ─── PIN input ────────────────────────────────────────────────────────────────

function PinInput({
  label,
  error,
  helperText,
  digits = 6,
  value = '',
  onChange,
  onComplete,
  // onScreenKeyboard is a no-op in Phase 1 — reserved for Phase 3
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onScreenKeyboard: _onScreenKeyboard = false,
}: PinInputProps) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([])

  const handleChange = useCallback(
    (index: number, char: string) => {
      const digit = char.replace(/\D/g, '').slice(-1)
      const arr = value.split('')
      arr[index] = digit
      const next = arr.join('').slice(0, digits)
      onChange?.(next)

      if (digit && index < digits - 1) {
        inputRefs.current[index + 1]?.focus()
      }
      if (next.length === digits) {
        onComplete?.(next)
      }
    },
    [value, digits, onChange, onComplete]
  )

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace') {
        if (value[index]) {
          const arr = value.split('')
          arr[index] = ''
          onChange?.(arr.join(''))
        } else if (index > 0) {
          inputRefs.current[index - 1]?.focus()
          const arr = value.split('')
          arr[index - 1] = ''
          onChange?.(arr.join(''))
        }
      } else if (e.key === 'ArrowLeft' && index > 0) {
        inputRefs.current[index - 1]?.focus()
      } else if (e.key === 'ArrowRight' && index < digits - 1) {
        inputRefs.current[index + 1]?.focus()
      }
    },
    [value, digits, onChange]
  )

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault()
      const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, digits)
      onChange?.(pasted)
      if (pasted.length === digits) onComplete?.(pasted)
      const focusIdx = Math.min(pasted.length, digits - 1)
      inputRefs.current[focusIdx]?.focus()
    },
    [digits, onChange, onComplete]
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {label && (
        <label
          style={{
            fontSize: 11,
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
            letterSpacing: '0.07em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
          }}
        >
          {label}
        </label>
      )}
      <div style={{ display: 'flex', gap: 10 }}>
        {Array.from({ length: digits }).map((_, i) => {
          const isFilled = Boolean(value[i])
          const isActive = value.length === i || (value.length === digits && i === digits - 1)
          return (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={value[i] ?? ''}
              autoComplete="off"
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={i === 0 ? handlePaste : undefined}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-primary)'
                e.currentTarget.style.boxShadow = 'var(--shadow-glow)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = isFilled ? 'var(--border-default)' : 'var(--border-default)'
                e.currentTarget.style.boxShadow = 'none'
              }}
              aria-label={`PIN digit ${i + 1}`}
              style={{
                width: 52,
                height: 64,
                textAlign: 'center',
                fontFamily: 'var(--font-mono)',
                fontSize: 24,
                fontWeight: 600,
                borderRadius: 'var(--radius-md)',
                border: `1.5px solid ${isActive ? 'var(--accent-primary)' : error ? 'var(--accent-danger)' : 'var(--border-default)'}`,
                background: isFilled ? 'var(--bg-surface)' : 'var(--bg-surface-3)',
                color: 'var(--text-primary)',
                outline: 'none',
                transition: `border-color var(--transition-fast), box-shadow var(--transition-fast), background var(--transition-fast)`,
                caretColor: 'var(--accent-primary)',
                cursor: 'text',
              }}
            />
          )
        })}
      </div>
      {(error || helperText) && (
        <span style={{ fontSize: 12, color: error ? 'var(--accent-danger)' : 'var(--text-muted)' }}>
          {error ?? helperText}
        </span>
      )}
    </div>
  )
}

// ─── Unified export ───────────────────────────────────────────────────────────

export const Input = forwardRef<HTMLInputElement, InputProps>((props, ref) => {
  if (props.type === 'pin') {
    return <PinInput {...props} />
  }
  return <StandardInput ref={ref} {...(props as TextInputProps)} />
})

Input.displayName = 'Input'
