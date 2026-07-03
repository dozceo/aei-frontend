import type { AppRole } from '@/types/app'
import { getRoleHome } from '@/lib/auth'

export type RouteAccess = AppRole[] | 'public'

export interface RouteAuthRule {
  prefix: string
  access: RouteAccess
}

export const ROUTE_AUTH_RULES: RouteAuthRule[] = [
  { prefix: '/', access: 'public' },
  { prefix: '/login', access: 'public' },
  { prefix: '/recall', access: ['STUDENT', 'TEACHER', 'ADMIN'] },
  { prefix: '/query', access: ['STUDENT'] },
  { prefix: '/project', access: 'public' },
  { prefix: '/student', access: ['STUDENT'] },
  { prefix: '/teacher', access: ['TEACHER', 'ADMIN'] },
  { prefix: '/parent', access: ['PARENT'] },
  { prefix: '/admin', access: ['ADMIN'] },
]

function matchRule(pathname: string): RouteAuthRule | null {
  const sorted = [...ROUTE_AUTH_RULES].sort((a, b) => b.prefix.length - a.prefix.length)
  for (const rule of sorted) {
    if (rule.prefix === '/' && pathname === '/') return rule
    if (rule.prefix !== '/' && pathname.startsWith(rule.prefix)) return rule
  }
  return null
}

export function isPublicRoute(pathname: string): boolean {
  const rule = matchRule(pathname)
  return rule?.access === 'public'
}

export function matchRouteAuth(pathname: string, role: AppRole | null): boolean {
  const rule = matchRule(pathname)
  if (!rule) return true
  if (rule.access === 'public') return true
  if (!role) return false
  return rule.access.includes(role)
}

export function redirectForUnauthorized(
  pathname: string,
  role: AppRole | null
): string {
  if (role) return getRoleHome(role)
  const login = new URL('/login', 'http://local')
  login.searchParams.set('redirect', pathname)
  return `${login.pathname}${login.search}`
}
