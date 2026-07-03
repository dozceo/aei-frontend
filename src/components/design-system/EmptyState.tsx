import { cn } from '@/lib/cn'
import { Button } from './Button'

export interface EmptyStateProps {
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  className?: string
  icon?: React.ReactNode
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  className,
  icon,
}: EmptyStateProps) {
  return (
    <div className={cn('state-empty', className)}>
      <div className="state-empty-icon" aria-hidden>
        {icon ?? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M8 12h8M12 8v8" />
          </svg>
        )}
      </div>
      <h3 className="text-base font-semibold text-[var(--ink)]">{title}</h3>
      {description ? (
        <p className="max-w-sm text-sm text-[var(--ink-muted)]">{description}</p>
      ) : null}
      {actionLabel && onAction ? (
        <Button variant="secondary" onClick={onAction} className="mt-2">
          {actionLabel}
        </Button>
      ) : null}
    </div>
  )
}
