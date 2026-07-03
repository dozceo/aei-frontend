import { forwardRef, type SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  hint?: string
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, hint, id, children, placeholder, ...props }, ref) => {
    const selectId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

    return (
      <div className="w-full">
        {label ? (
          <label htmlFor={selectId} className="field-label">
            {label}
          </label>
        ) : null}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              'field-input appearance-none pr-10',
              error && 'border-[var(--coral)] focus:border-[var(--coral)] focus:ring-[var(--coral)]/20',
              className
            )}
            aria-invalid={error ? true : undefined}
            aria-describedby={
              error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined
            }
            {...props}
          >
            {placeholder ? (
              <option value="" disabled>
                {placeholder}
              </option>
            ) : null}
            {children}
          </select>
          <span
            aria-hidden
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)]"
          >
            ▾
          </span>
        </div>
        {hint && !error ? (
          <p id={`${selectId}-hint`} className="mt-1 text-xs text-[var(--ink-muted)]">
            {hint}
          </p>
        ) : null}
        {error ? (
          <p id={`${selectId}-error`} className="field-error" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    )
  }
)

Select.displayName = 'Select'
