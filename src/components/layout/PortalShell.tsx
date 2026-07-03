'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BottomNav } from '@/components/design-system'
import { getRoleNavItems, isNavActive } from '@/lib/role-nav'
import type { AppRole } from '@/types/app'

export interface PortalShellProps {
  role: AppRole
  title: string
  subtitle?: string
  children: React.ReactNode
  hideNav?: boolean
  headerAction?: React.ReactNode
}

export function PortalShell({
  role,
  title,
  subtitle,
  children,
  hideNav = false,
  headerAction,
}: PortalShellProps) {
  const pathname = usePathname()
  const navItems = getRoleNavItems(role).map((item) => ({
    ...item,
    active: isNavActive(pathname, item.href),
  }))

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col overflow-x-hidden">
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--paper)]/95 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href="/" className="text-xs font-medium text-[var(--ink-subtle)] hover:text-[var(--ink)]">
              Sankalp AEI
            </Link>
            <h1 className="truncate font-serif text-xl font-semibold text-[var(--ink)]">{title}</h1>
            {subtitle ? (
              <p className="truncate text-sm text-[var(--ink-muted)]">{subtitle}</p>
            ) : null}
          </div>
          {headerAction ? <div className="shrink-0">{headerAction}</div> : null}
        </div>
      </header>

      <main className={`flex-1 px-4 py-4 ${hideNav ? '' : 'pb-safe-nav'}`}>{children}</main>

      {!hideNav && navItems.length > 0 ? <BottomNav items={navItems} /> : null}
    </div>
  )
}
