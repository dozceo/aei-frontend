import { Card, CardContent, CardDescription, CardHeader, CardTitle, StatCard } from '@/components/design-system'

export default function AdminAnalyticsPage() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Active learners" value="—" hint="7-day window" trend="up" />
        <StatCard label="Avg mastery" value="—" hint="Cohort mean" />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Analytics</CardTitle>
          <CardDescription>Engagement, mastery trends, and ML insights.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[var(--ink-muted)]">
            Analytics dashboards connect to BFF aggregation endpoints and ML proxy predictions.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
