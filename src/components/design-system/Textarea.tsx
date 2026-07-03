import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, rows = 4, ...props }, ref) => {
    const textareaId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

    return (
      <div className="w-full">
        {label ? (
          <label htmlFor={textareaId} className="field-label">
            {label}
          </label>
        ) : null}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          className={cn(
            'field-input min-h-[6rem] resize-y py-3',
            error && 'border-[var(--coral)] focus:border-[var(--coral)] focus:ring-[var(--coral)]/20',
            className
          )}
          aria-invalid={error ? true : undefined}
          aria-describedby={
            error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined
          }
          {...props}
        />
        {hint && !error ? (
          <p id={`${textareaId}-hint`} className="mt-1 text-xs text-[var(--ink-muted)]">
            {hint}
          </p>
        ) : null}
        {error ? (
          <p id={`${textareaId}-error`} className="field-error" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
