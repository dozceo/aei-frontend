import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

const badgeVariants = cva(
  'inline-flex items-center rounded-[var(--radius-full)] px-2.5 py-0.5 text-xs font-medium',
  {
    variants: {
      variant: {
        default: 'bg-[var(--primary-muted)] text-[var(--primary)]',
        secondary: 'bg-[var(--paper-sunken)] text-[var(--ink-muted)]',
        sky: 'bg-[var(--sky-bg)] text-[var(--sky-foreground)]',
        honey: 'bg-[var(--honey-bg)] text-[var(--honey-foreground)]',
        sage: 'bg-[var(--sage-bg)] text-[var(--sage-foreground)]',
        coral: 'bg-[var(--coral-bg)] text-[var(--coral-foreground)]',
        outline: 'border border-[var(--border-strong)] bg-transparent text-[var(--ink)]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { badgeVariants }
