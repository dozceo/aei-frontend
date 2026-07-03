import { Card, CardContent, CardDescription, CardHeader, CardTitle, EmptyState } from '@/components/design-system'

export default function TeacherSchedulePage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Schedule</CardTitle>
        <CardDescription>Timetable and recall slot planning.</CardDescription>
      </CardHeader>
      <CardContent>
        <EmptyState title="Schedule empty" description="Set up timetables to drive daily recall slots." />
      </CardContent>
    </Card>
  )
}
