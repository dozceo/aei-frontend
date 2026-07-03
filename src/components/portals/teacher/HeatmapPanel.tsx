'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle, ErrorState, Skeleton, StatCard } from '@/components/design-system'
import { backendFetch } from '@/lib/backend-client'
import type { StudentRow } from './RosterPanel'

interface StudentsResponse {
  students?: StudentRow[]
  items?: StudentRow[]
}

function bucketMastery(rows: StudentRow[]) {
  const buckets = { strong: 0, steady: 0, support: 0, unknown: 0 }
  for (const row of rows) {
    if (row.mastery == null) {
      buckets.unknown += 1
    } else if (row.mastery >= 0.75) {
      buckets.strong += 1
    } else if (row.mastery >= 0.5) {
      buckets.steady += 1
    } else {
      buckets.support += 1
    }
  }
  return buckets
}

export function HeatmapPanel() {
  const query = useQuery({
    queryKey: ['students', 'heatmap'],
    queryFn: () => backendFetch<StudentsResponse>('/api/students'),
  })

  if (query.isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    )
  }

  if (query.isError) {
    return (
      <ErrorState
        title="Heatmap unavailable"
        message={query.error instanceof Error ? query.error.message : 'Try again.'}
        onRetry={() => query.refetch()}
      />
    )
  }

  const rows = query.data?.students ?? query.data?.items ?? []
  const buckets = bucketMastery(rows)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Strong" value={buckets.strong} hint="≥ 75% mastery" trend="up" />
        <StatCard label="Steady" value={buckets.steady} hint="50–74% mastery" trend="neutral" />
        <StatCard label="Needs support" value={buckets.support} hint="< 50% mastery" trend="down" />
        <StatCard label="No data" value={buckets.unknown} hint="Awaiting attempts" trend="neutral" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cohort heatmap</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {rows.map((row) => {
              const mastery = row.mastery ?? 0
              const tone =
                row.mastery == null
                  ? 'bg-[var(--paper-sunken)]'
                  : mastery >= 0.75
                    ? 'bg-[var(--sage-bg)]'
                    : mastery >= 0.5
                      ? 'bg-[var(--honey-bg)]'
                      : 'bg-[var(--coral-bg)]'
              return (
                <div
                  key={row.id}
                  className={`aspect-square rounded-[var(--radius-sm)] ${tone} flex items-center justify-center p-1 text-center text-[10px] font-medium text-[var(--ink-muted)]`}
                  title={row.name}
                >
                  {row.name.split(' ')[0]}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
