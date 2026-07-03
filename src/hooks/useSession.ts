'use client'

import { useQuery } from '@tanstack/react-query'
import { backendFetch } from '@/lib/backend-client'
import { normalizeRole } from '@/lib/auth'
import type { AppRole } from '@/types/app'

export interface SessionUser {
  uid: string
  email?: string | null
  role: AppRole | null
  bookingId?: string
  schoolId?: string
}

export interface SessionResponse {
  ok: boolean
  user?: {
    uid: string
    email?: string
    role?: string
    bookingId?: string
    schoolId?: string
  }
}

export function useSession() {
  return useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const res = await backendFetch<SessionResponse>('/api/auth/me')
      const role = normalizeRole(res.user?.role ?? null)
      return {
        authenticated: Boolean(res.user),
        user: res.user
          ? {
              uid: res.user.uid,
              email: res.user.email ?? null,
              role,
              bookingId: res.user.bookingId,
              schoolId: res.user.schoolId,
            }
          : undefined,
      }
    },
    staleTime: 30_000,
    retry: false,
  })
}
