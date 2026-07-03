import type { ReactNode } from 'react'
import {
  AlertTriangle,
  BarChart3,
  Brain,
  CalendarCheck,
  FileText,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Sparkles,
  Users,
} from 'lucide-react'

export interface AdminNavItem {
  href: string
  label: string
  icon: ReactNode
}

export interface AdminNavGroup {
  title: string
  items: AdminNavItem[]
}

export const ADMIN_PRIMARY_NAV: AdminNavItem[] = [
  { href: '/admin', label: 'Overview', icon: <LayoutDashboard className="h-5 w-5" /> },
  { href: '/admin/participants', label: 'People', icon: <Users className="h-5 w-5" /> },
  { href: '/admin/ews', label: 'EWS', icon: <AlertTriangle className="h-5 w-5" /> },
]

export const ADMIN_MORE_GROUPS: AdminNavGroup[] = [
  {
    title: 'Operations',
    items: [
      { href: '/admin/attendance', label: 'Attendance', icon: <CalendarCheck className="h-5 w-5" /> },
      { href: '/admin/exams', label: 'Exams', icon: <FileText className="h-5 w-5" /> },
      { href: '/admin/queries', label: 'Queries', icon: <MessageSquare className="h-5 w-5" /> },
      { href: '/admin/recall', label: 'Recall', icon: <Sparkles className="h-5 w-5" /> },
    ],
  },
  {
    title: 'Intelligence',
    items: [
      { href: '/admin/brainmap', label: 'Brainmap', icon: <Brain className="h-5 w-5" /> },
      { href: '/admin/analytics', label: 'Analytics', icon: <BarChart3 className="h-5 w-5" /> },
    ],
  },
  {
    title: 'System',
    items: [
      { href: '/admin/settings', label: 'Settings', icon: <Settings className="h-5 w-5" /> },
    ],
  },
]

export function isAdminNavActive(pathname: string, href: string): boolean {
  if (href === '/admin') return pathname === '/admin'
  return pathname === href || pathname.startsWith(`${href}/`)
}
