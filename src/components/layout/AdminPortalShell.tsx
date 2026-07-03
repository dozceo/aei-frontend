'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Sheet } from '@/components/design-system'
import {
  ADMIN_MORE_GROUPS,
  ADMIN_PRIMARY_NAV,
  isAdminNavActive,
} from '@/lib/admin-nav'
import { Menu } from 'lucide-react'

export interface AdminPortalShellProps {
  title?: string
  subtitle?: string
  children: React.ReactNode
}

export function AdminPortalShell({ title, subtitle, children }: AdminPortalShellProps) {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)

  const resolvedTitle =
    title ??
    [...ADMIN_PRIMARY_NAV, ...ADMIN_MORE_GROUPS.flatMap((g) => g.items)].find((item) =>
      isAdminNavActive(pathname, item.href)
    )?.label ??
    'Admin'

  const bottomItems = [
    ...ADMIN_PRIMARY_NAV.map((item) => ({
      href: item.href,
      label: item.label,
      icon: item.icon,
      active: isAdminNavActive(pathname, item.href),
    })),
    {
      href: '#more',
      label: 'More',
      icon: <Menu className="h-5 w-5" />,
      active: ADMIN_MORE_GROUPS.some((group) =>
        group.items.some((item) => isAdminNavActive(pathname, item.href))
      ),
    },
  ]

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col overflow-x-hidden">
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--paper)]/95 px-4 py-3 backdrop-blur-sm">
        <Link href="/" className="text-xs font-medium text-[var(--ink-subtle)] hover:text-[var(--ink)]">
          Sankalp AEI · Admin
        </Link>
        <h1 className="font-serif text-xl font-semibold text-[var(--ink)]">{resolvedTitle}</h1>
        {subtitle ? <p className="text-sm text-[var(--ink-muted)]">{subtitle}</p> : null}
      </header>

      <main className="flex-1 px-4 py-4 pb-safe-nav">{children}</main>

      <nav className="bottom-nav" aria-label="Admin navigation">
        {bottomItems.map((item) =>
          item.href === '#more' ? (
            <button
              key="more"
              type="button"
              className="bottom-nav-item pressable"
              data-active={item.active ? 'true' : undefined}
              onClick={() => setMoreOpen(true)}
            >
              <span className="flex h-6 w-6 items-center justify-center" aria-hidden>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          ) : (
            <Link
              key={item.href}
              href={item.href}
              className="bottom-nav-item pressable"
              data-active={item.active ? 'true' : undefined}
              aria-current={item.active ? 'page' : undefined}
            >
              <span className="flex h-6 w-6 items-center justify-center" aria-hidden>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          )
        )}
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen} title="More admin tools">
        <div className="space-y-6">
          {ADMIN_MORE_GROUPS.map((group) => (
            <div key={group.title}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--ink-subtle)]">
                {group.title}
              </p>
              <div className="grid gap-2">
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="pressable flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border)] px-3 py-3 hover:bg-[var(--paper-sunken)]"
                    onClick={() => setMoreOpen(false)}
                  >
                    <span className="text-[var(--primary)]">{item.icon}</span>
                    <span className="text-sm font-medium text-[var(--ink)]">{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Sheet>
    </div>
  )
}
