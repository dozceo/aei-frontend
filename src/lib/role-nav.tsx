import type { ReactNode } from 'react'
import type { AppRole } from '@/types/app'
import {
  BookOpen,
  Brain,
  Calendar,
  ClipboardList,
  Gamepad2,
  GraduationCap,
  Home,
  Inbox,
  LayoutDashboard,
  MessageSquare,
  Sparkles,
  User,
  Users,
} from 'lucide-react'

export interface RoleNavItem {
  href: string
  label: string
  iconName: string
}

export interface ResolvedNavItem {
  href: string
  label: string
  icon: ReactNode
}

const ICONS: Record<string, ReactNode> = {
  home: <Home className="h-5 w-5" />,
  quiz: <ClipboardList className="h-5 w-5" />,
  brain: <Brain className="h-5 w-5" />,
  play: <Gamepad2 className="h-5 w-5" />,
  me: <User className="h-5 w-5" />,
  students: <Users className="h-5 w-5" />,
  topics: <BookOpen className="h-5 w-5" />,
  chapters: <GraduationCap className="h-5 w-5" />,
  schedule: <Calendar className="h-5 w-5" />,
  summary: <LayoutDashboard className="h-5 w-5" />,
  inbox: <Inbox className="h-5 w-5" />,
  reports: <MessageSquare className="h-5 w-5" />,
  sparkles: <Sparkles className="h-5 w-5" />,
}

const ROLE_NAV: Record<AppRole, RoleNavItem[]> = {
  STUDENT: [
    { href: '/student', label: 'Today', iconName: 'home' },
    { href: '/student/quiz', label: 'Quiz', iconName: 'quiz' },
    { href: '/student/brain', label: 'Brain', iconName: 'brain' },
    { href: '/student/play', label: 'Play', iconName: 'play' },
    { href: '/student/me', label: 'Me', iconName: 'me' },
  ],
  TEACHER: [
    { href: '/teacher', label: 'Today', iconName: 'home' },
    { href: '/teacher/students', label: 'Students', iconName: 'students' },
    { href: '/teacher/topics', label: 'Topics', iconName: 'topics' },
    { href: '/teacher/chapters', label: 'Chapters', iconName: 'chapters' },
    { href: '/teacher/schedule', label: 'Schedule', iconName: 'schedule' },
  ],
  PARENT: [
    { href: '/parent', label: 'Summary', iconName: 'summary' },
    { href: '/parent/inbox', label: 'Inbox', iconName: 'inbox' },
    { href: '/parent/reports', label: 'Reports', iconName: 'reports' },
  ],
  ADMIN: [],
}

export function getRoleNavItems(role: AppRole): ResolvedNavItem[] {
  return (ROLE_NAV[role] ?? []).map((item) => ({
    href: item.href,
    label: item.label,
    icon: ICONS[item.iconName] ?? <Home className="h-5 w-5" />,
  }))
}

export function isNavActive(pathname: string, href: string): boolean {
  if (href === '/student' || href === '/teacher' || href === '/parent' || href === '/admin') {
    return pathname === href
  }
  return pathname === href || pathname.startsWith(`${href}/`)
}
