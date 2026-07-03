'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

const buttonVariants = cva(
  'pressable tap-target inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)] active:bg-[var(--primary-active)]',
        secondary:
          'border border-[var(--border-strong)] bg-[var(--paper-raised)] text-[var(--ink)] hover:bg-[var(--paper-sunken)]',
        ghost:
          'text-[var(--ink-muted)] hover:bg-[var(--paper-sunken)] hover:text-[var(--ink)]',
        destructive:
          'bg-[var(--coral)] text-white hover:opacity-90',
      },
      size: {
        default: 'h-11 min-h-[var(--tap-target)] px-4 text-sm',
        sm: 'h-9 min-h-9 px-3 text-sm',
        lg: 'h-12 min-h-12 px-6 text-base',
        icon: 'h-11 w-11 min-h-[var(--tap-target)] min-w-[var(--tap-target)] p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? (
          <>
            <span
              className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
              aria-hidden
            />
            <span className="sr-only">Loading</span>
            {children}
          </>
        ) : (
          children
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { buttonVariants }
