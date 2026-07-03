import { Card, CardContent, CardDescription, CardHeader, CardTitle, StatCard } from '@/components/design-system'

export default function ParentSummaryPage() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Attendance" value="—" hint="This week" />
        <StatCard label="Loop completion" value="—" hint="Last 7 days" trend="up" />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Weekly summary</CardTitle>
          <CardDescription>High-level progress for your linked student.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[var(--ink-muted)]">
            Summaries will populate once your child's account is linked and active.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
