'use client'

import { cn } from '@/lib/cn'

export type ToastVariant = 'default' | 'success' | 'error' | 'warning'

export interface ToastData {
  id: string
  title: string
  description?: string
  variant?: ToastVariant
}

export interface ToastProps extends ToastData {
  onDismiss: (id: string) => void
}

export function Toast({ id, title, description, variant = 'default', onDismiss }: ToastProps) {
  return (
    <div
      className="toast-item"
      data-variant={variant}
      role="status"
      aria-live="polite"
    >
      <div className="flex-1">
        <p className="font-medium">{title}</p>
        {description ? <p className="mt-0.5 text-sm opacity-90">{description}</p> : null}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(id)}
        className="tap-target -mr-1 -mt-1 flex shrink-0 items-center justify-center rounded-[var(--radius-sm)] opacity-80 hover:opacity-100"
        aria-label="Dismiss notification"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

export function ToastStack({
  toasts,
  onDismiss,
  className,
}: {
  toasts: ToastData[]
  onDismiss: (id: string) => void
  className?: string
}) {
  if (toasts.length === 0) return null

  return (
    <div className={cn('toast-stack', className)} aria-label="Notifications">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onDismiss={onDismiss} />
      ))}
    </div>
  )
}
