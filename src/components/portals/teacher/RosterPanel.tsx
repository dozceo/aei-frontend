'use client'

import { useQuery } from '@tanstack/react-query'
import { DataTable, ErrorState, Skeleton } from '@/components/design-system'
import { backendFetch } from '@/lib/backend-client'
import { useSession } from '@/hooks/useSession'
import { DEFAULT_SCHOOL } from '@/lib/constants'

export interface StudentRow {
  id: string
  name: string
  email?: string
  division?: string
  mastery?: number
}

interface StudentsResponse {
  ok: boolean
  data?: Array<{
    id: string
    bookingId?: string
    name?: string
    displayName?: string
    email?: string
    divisionId?: string
    classId?: string
    mastery?: number
    masteryPct?: number
  }>
}

function mapStudentRow(raw: NonNullable<StudentsResponse['data']>[number]): StudentRow {
  return {
    id: raw.id,
    name: raw.name || raw.displayName || raw.email || raw.id,
    email: raw.email,
    division: raw.divisionId || raw.classId,
    mastery: raw.mastery ?? (raw.masteryPct != null ? raw.masteryPct / 100 : undefined),
  }
}

export function RosterPanel() {
  const { data: session } = useSession()
  const schoolId = session?.user?.schoolId || DEFAULT_SCHOOL

  const query = useQuery({
    queryKey: ['students', 'roster', schoolId],
    queryFn: async () => {
      const res = await backendFetch<StudentsResponse>(
        `/api/students?schoolId=${encodeURIComponent(schoolId)}`
      )
      return (res.data ?? []).map(mapStudentRow)
    },
  })

  if (query.isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  if (query.isError) {
    return (
      <ErrorState
        title="Could not load roster"
        message={query.error instanceof Error ? query.error.message : 'Try again.'}
        onRetry={() => query.refetch()}
      />
    )
  }

  return (
    <DataTable<StudentRow>
      columns={[
        { key: 'name', header: 'Name' },
        { key: 'division', header: 'Division' },
        {
          key: 'mastery',
          header: 'Mastery',
          render: (row) => (row.mastery != null ? `${Math.round(row.mastery * 100)}%` : '—'),
        },
      ]}
      data={query.data ?? []}
      getRowKey={(row) => row.id}
      emptyMessage="No students in this cohort yet."
    />
  )
}
