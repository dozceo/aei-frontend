import type { AppRole } from '@/types/app'

export const AUTH_COOKIE = 'sankalp_session'
export const ROLE_COOKIE = 'sankalp_role'
export const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7

export function setClientAuthCookie(name: string, value: string, maxAgeSeconds = AUTH_COOKIE_MAX_AGE_SECONDS) {
  if (typeof document === 'undefined') return
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax${secure}`
}

export function clearClientAuthCookie(name: string) {
  setClientAuthCookie(name, '', 0)
}

export function readClientAuthCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const prefix = `${name}=`
  const match = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix))
  if (!match) return null
  return decodeURIComponent(match.slice(prefix.length))
}

const ROLE_ALIASES: Record<string, AppRole> = {
  student: 'STUDENT',
  STUDENT: 'STUDENT',
  teacher: 'TEACHER',
  class_teacher: 'TEACHER',
  hod: 'TEACHER',
  principal: 'TEACHER',
  TEACHER: 'TEACHER',
  parent: 'PARENT',
  PARENT: 'PARENT',
  admin: 'ADMIN',
  school_admin: 'ADMIN',
  super_admin: 'ADMIN',
  ADMIN: 'ADMIN',
}

export function normalizeRole(raw: string | undefined | null): AppRole | null {
  if (!raw) return null
  return ROLE_ALIASES[raw.trim()] ?? null
}

export function getRoleHome(role: AppRole): string {
  switch (role) {
    case 'STUDENT':
      return '/student'
    case 'TEACHER':
      return '/teacher'
    case 'PARENT':
      return '/parent'
    case 'ADMIN':
      return '/admin'
    default:
      return '/'
  }
}

export function roleFromPath(pathname: string): AppRole | null {
  if (pathname.startsWith('/student')) return 'STUDENT'
  if (pathname.startsWith('/teacher')) return 'TEACHER'
  if (pathname.startsWith('/parent')) return 'PARENT'
  if (pathname.startsWith('/admin')) return 'ADMIN'
  return null
}
