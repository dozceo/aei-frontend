'use client'

import { useQuery } from '@tanstack/react-query'
import { DataTable, ErrorState, Skeleton } from '@/components/design-system'
import { backendFetch } from '@/lib/backend-client'

export interface StudentRow {
  id: string
  name: string
  email?: string
  division?: string
  mastery?: number
}

interface StudentsResponse {
  students?: StudentRow[]
  items?: StudentRow[]
}

export function RosterPanel() {
  const query = useQuery({
    queryKey: ['students', 'roster'],
    queryFn: () => backendFetch<StudentsResponse>('/api/students'),
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

  const rows = query.data?.students ?? query.data?.items ?? []

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
      data={rows}
      getRowKey={(row) => row.id}
      emptyMessage="No students in this cohort yet."
    />
  )
}
