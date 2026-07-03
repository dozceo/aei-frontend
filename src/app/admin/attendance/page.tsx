import { Card, CardContent, CardDescription, CardHeader, CardTitle, EmptyState } from '@/components/design-system'

export default function AdminAttendancePage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance</CardTitle>
        <CardDescription>Daily loop completion and attendance records.</CardDescription>
      </CardHeader>
      <CardContent>
        <EmptyState title="No attendance data" description="Attendance syncs when students complete loops." />
      </CardContent>
    </Card>
  )
}
