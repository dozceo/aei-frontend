'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

export interface SheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  children: ReactNode
  className?: string
}

export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: SheetProps) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false)
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, onOpenChange])

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close sheet"
            className="sheet-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'sheet-title' : undefined}
            aria-describedby={description ? 'sheet-description' : undefined}
            className={cn('sheet-panel', className)}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          >
            <div className="sheet-handle" aria-hidden />
            {(title || description) && (
              <div className="border-b border-[var(--border)] px-4 pb-3">
                {title ? (
                  <h2 id="sheet-title" className="text-lg font-semibold text-[var(--ink)]">
                    {title}
                  </h2>
                ) : null}
                {description ? (
                  <p id="sheet-description" className="mt-1 text-sm text-[var(--ink-muted)]">
                    {description}
                  </p>
                ) : null}
              </div>
            )}
            <div className="max-h-[calc(90vh-4rem)] overflow-y-auto p-4">{children}</div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  )
}
