import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

    return (
      <div className="w-full">
        {label ? (
          <label htmlFor={inputId} className="field-label">
            {label}
          </label>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'field-input',
            error && 'border-[var(--coral)] focus:border-[var(--coral)] focus:ring-[var(--coral)]/20',
            className
          )}
          aria-invalid={error ? true : undefined}
          aria-describedby={
            error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
          }
          {...props}
        />
        {hint && !error ? (
          <p id={`${inputId}-hint`} className="mt-1 text-xs text-[var(--ink-muted)]">
            {hint}
          </p>
        ) : null}
        {error ? (
          <p id={`${inputId}-error`} className="field-error" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    )
  }
)

Input.displayName = 'Input'
