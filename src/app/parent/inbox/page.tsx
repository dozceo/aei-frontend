'use client'

import { useQuery } from '@tanstack/react-query'
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  ErrorState,
  Skeleton,
} from '@/components/design-system'
import { backendFetch } from '@/lib/backend-client'

interface NotificationItem {
  id: string
  title: string
  body?: string
  read?: boolean
  createdAt?: string
}

interface NotificationsResponse {
  notifications?: NotificationItem[]
  items?: NotificationItem[]
}

export default function ParentInboxPage() {
  const query = useQuery({
    queryKey: ['notifications'],
    queryFn: () => backendFetch<NotificationsResponse>('/api/notifications'),
  })

  const items = query.data?.notifications ?? query.data?.items ?? []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inbox</CardTitle>
        <CardDescription>Alerts and updates from school.</CardDescription>
      </CardHeader>
      <CardContent>
        {query.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : null}

        {query.isError ? (
          <ErrorState
            title="Inbox unavailable"
            message={query.error instanceof Error ? query.error.message : 'Try again.'}
            onRetry={() => query.refetch()}
          />
        ) : null}

        {!query.isLoading && !query.isError && items.length === 0 ? (
          <EmptyState title="All caught up" description="No new notifications right now." />
        ) : null}

        {!query.isLoading && !query.isError && items.length > 0 ? (
          <ul className="space-y-3">
            {items.map((item) => (
              <li
                key={item.id}
                className="rounded-[var(--radius-md)] border border-[var(--border)] p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-[var(--ink)]">{item.title}</p>
                  {!item.read ? <Badge variant="sky">New</Badge> : null}
                </div>
                {item.body ? (
                  <p className="mt-1 text-sm text-[var(--ink-muted)]">{item.body}</p>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  )
}
