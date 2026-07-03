import { Card, CardContent, CardDescription, CardHeader, CardTitle, StatCard } from '@/components/design-system'
import { SankalpLoopPanel } from '@/components/portals/student/SankalpLoopPanel'

export default function StudentTodayPage() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Streak" value="—" hint="Complete today's loop" />
        <StatCard label="Attendance" value="—" hint="Synced via BFF" />
      </div>

      <Card className="animate-rise-delay-1 border-[var(--primary-muted)] bg-[var(--primary-muted)]/30">
        <CardHeader>
          <CardTitle>Start your loop</CardTitle>
          <CardDescription>
            Seven steps to recall, plan, map, dump, and finish strong today.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SankalpLoopPanel />
        </CardContent>
      </Card>
    </div>
  )
}
