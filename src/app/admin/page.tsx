import { Card, CardContent, CardDescription, CardHeader, CardTitle, StatCard } from '@/components/design-system'

export default function AdminOverviewPage() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Participants" value="—" hint="Active accounts" />
        <StatCard label="Open queries" value="—" hint="Needs response" />
        <StatCard label="EWS alerts" value="—" hint="This week" trend="down" />
        <StatCard label="Attendance" value="—" hint="Today" trend="up" />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
          <CardDescription>Key metrics across participants, EWS, and operations.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[var(--ink-muted)]">
            Connect the BFF to populate live stats from Firestore-backed APIs.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
