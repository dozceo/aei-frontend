import { Card, CardContent, CardDescription, CardHeader, CardTitle, StatCard } from '@/components/design-system'

export default function AdminEwsPage() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Critical" value="—" hint="Immediate action" trend="down" />
        <StatCard label="Watch" value="—" hint="Monitor closely" trend="neutral" />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Early Warning System</CardTitle>
          <CardDescription>Cohort risk tiers and intervention queue.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[var(--ink-muted)]">
            EWS cohort jobs publish from the BFF once risk models are configured.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
