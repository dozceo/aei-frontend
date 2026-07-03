import type { AppRole } from '@/types/app'

export interface AppRoute {
  path: string
  label: string
  roles?: AppRole[]
  group?: string
}

export const APP_ROUTES: AppRoute[] = [
  { path: '/', label: 'Home' },
  { path: '/login', label: 'Login' },
  { path: '/student', label: 'Today', roles: ['STUDENT'], group: 'student' },
  { path: '/student/quiz', label: 'Quiz', roles: ['STUDENT'], group: 'student' },
  { path: '/student/brain', label: 'Brain', roles: ['STUDENT'], group: 'student' },
  { path: '/student/play', label: 'Play', roles: ['STUDENT'], group: 'student' },
  { path: '/student/me', label: 'Me', roles: ['STUDENT'], group: 'student' },
  { path: '/teacher', label: 'Today', roles: ['TEACHER'], group: 'teacher' },
  { path: '/teacher/students', label: 'Students', roles: ['TEACHER'], group: 'teacher' },
  { path: '/teacher/topics', label: 'Topics', roles: ['TEACHER'], group: 'teacher' },
  { path: '/teacher/chapters', label: 'Chapters', roles: ['TEACHER'], group: 'teacher' },
  { path: '/teacher/schedule', label: 'Schedule', roles: ['TEACHER'], group: 'teacher' },
  { path: '/parent', label: 'Summary', roles: ['PARENT'], group: 'parent' },
  { path: '/parent/inbox', label: 'Inbox', roles: ['PARENT'], group: 'parent' },
  { path: '/parent/reports', label: 'Reports', roles: ['PARENT'], group: 'parent' },
  { path: '/admin', label: 'Overview', roles: ['ADMIN'], group: 'admin' },
  { path: '/admin/participants', label: 'Participants', roles: ['ADMIN'], group: 'admin' },
  { path: '/admin/ews', label: 'EWS', roles: ['ADMIN'], group: 'admin' },
  { path: '/admin/attendance', label: 'Attendance', roles: ['ADMIN'], group: 'admin' },
  { path: '/admin/exams', label: 'Exams', roles: ['ADMIN'], group: 'admin' },
  { path: '/admin/queries', label: 'Queries', roles: ['ADMIN'], group: 'admin' },
  { path: '/admin/recall', label: 'Recall', roles: ['ADMIN'], group: 'admin' },
  { path: '/admin/brainmap', label: 'Brainmap', roles: ['ADMIN'], group: 'admin' },
  { path: '/admin/analytics', label: 'Analytics', roles: ['ADMIN'], group: 'admin' },
  { path: '/admin/settings', label: 'Settings', roles: ['ADMIN'], group: 'admin' },
  { path: '/recall/[sessionId]', label: 'Recall Session' },
  { path: '/query', label: 'Ask a Question', roles: ['STUDENT'] },
  { path: '/project', label: 'Project' },
]

export function routesForRole(role: AppRole): AppRoute[] {
  return APP_ROUTES.filter((route) => !route.roles || route.roles.includes(role))
}
