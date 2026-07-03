import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/design-system'
import { RosterPanel } from '@/components/portals/teacher/RosterPanel'

export default function TeacherStudentsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Students</CardTitle>
        <CardDescription>Roster loaded from BFF GET /api/students.</CardDescription>
      </CardHeader>
      <CardContent>
        <RosterPanel />
      </CardContent>
    </Card>
  )
}
