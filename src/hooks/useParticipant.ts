'use client'

import { useQuery } from '@tanstack/react-query'
import { backendFetch } from '@/lib/backend-client'
import { useSession } from '@/hooks/useSession'

export interface ParticipantRecord {
  id: string
  bookingId?: string
  name?: string
  displayName?: string
  divisionId?: string
  classId?: string
  schoolId?: string
  loopAttendance?: Record<string, boolean | number | string>
  streaks?: { current?: number; longest?: number }
  streak?: number
}

interface StudentResponse {
  ok: boolean
  student?: ParticipantRecord
}

function resolveStudentId(session: ReturnType<typeof useSession>['data']) {
  return session?.user?.bookingId ?? session?.user?.uid ?? null
}

export function useParticipant() {
  const { data: session } = useSession()
  const studentId = resolveStudentId(session)

  return useQuery({
    queryKey: ['participant', studentId],
    enabled: Boolean(studentId),
    queryFn: async () => {
      const res = await backendFetch<StudentResponse>(`/api/students/${studentId}`)
      return res.student ?? null
    },
    staleTime: 30_000,
  })
}

export function countLoopDays(loopAttendance?: Record<string, unknown>) {
  if (!loopAttendance) return 0
  return Object.values(loopAttendance).filter(Boolean).length
}

export function attendedToday(loopAttendance?: Record<string, unknown>) {
  if (!loopAttendance) return false
  const today = new Date().toISOString().slice(0, 10)
  return Boolean(loopAttendance[today])
}
