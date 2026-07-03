import type { AppRole } from '@/types/app'

export const AUTH_COOKIE = 'sankalp_session'
export const ROLE_COOKIE = 'sankalp_role'

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
