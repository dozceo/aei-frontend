'use client'

import Link from 'next/link'
import { cn } from '@/lib/cn'

export interface BottomNavItem {
  href: string
  label: string
  icon: React.ReactNode
  active?: boolean
}

export interface BottomNavProps {
  items: BottomNavItem[]
  className?: string
}

export function BottomNav({ items, className }: BottomNavProps) {
  return (
    <nav className={cn('bottom-nav', className)} aria-label="Main navigation">
      {items.map((item) => (
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
      ))}
    </nav>
  )
}
