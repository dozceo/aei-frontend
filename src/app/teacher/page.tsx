import { Card, CardContent, CardDescription, CardHeader, CardTitle, StatCard } from '@/components/design-system'
import { HeatmapPanel } from '@/components/portals/teacher/HeatmapPanel'

export default function TeacherTodayPage() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Students" value="—" hint="From roster" />
        <StatCard label="At risk" value="—" hint="EWS signals" trend="down" />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Today&rsquo;s cohort</CardTitle>
          <CardDescription>Mastery heatmap from recent student activity.</CardDescription>
        </CardHeader>
        <CardContent>
          <HeatmapPanel />
        </CardContent>
      </Card>
    </div>
  )
}
