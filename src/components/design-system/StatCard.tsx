import { cn } from '@/lib/cn'

export interface StatCardProps {
  label: string
  value: string | number
  hint?: string
  trend?: 'up' | 'down' | 'neutral'
  className?: string
}

const trendColors = {
  up: 'text-[var(--sage)]',
  down: 'text-[var(--coral)]',
  neutral: 'text-[var(--ink-muted)]',
} as const

export function StatCard({ label, value, hint, trend = 'neutral', className }: StatCardProps) {
  return (
    <div className={cn('surface animate-rise p-4', className)}>
      <p className="text-sm font-medium text-[var(--ink-muted)]">{label}</p>
      <p className="mt-1 font-serif text-2xl font-semibold tracking-tight text-[var(--ink)]">
        {value}
      </p>
      {hint ? (
        <p className={cn('mt-1 text-xs font-medium', trendColors[trend])}>{hint}</p>
      ) : null}
    </div>
  )
}
