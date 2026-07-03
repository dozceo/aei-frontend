import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/design-system'
import { RosterPanel } from '@/components/portals/teacher/RosterPanel'

export default function AdminParticipantsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Participants</CardTitle>
        <CardDescription>All student and teacher accounts in the school.</CardDescription>
      </CardHeader>
      <CardContent>
        <RosterPanel />
      </CardContent>
    </Card>
  )
}
