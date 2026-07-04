import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/design-system'
import { SankalpLoopPanel } from '@/components/portals/student/SankalpLoopPanel'
import { StudentTodayStats } from '@/components/portals/student/StudentTodayStats'

export default function StudentTodayPage() {
  return (
    <div className="space-y-4">
      <StudentTodayStats />

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
