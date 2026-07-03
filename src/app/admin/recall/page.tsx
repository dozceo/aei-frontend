import { Card, CardContent, CardDescription, CardHeader, CardTitle, EmptyState } from '@/components/design-system'

export default function AdminRecallPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recall</CardTitle>
        <CardDescription>Session recall content and question banks.</CardDescription>
      </CardHeader>
      <CardContent>
        <EmptyState title="No recall sessions" description="Publish recall content for upcoming classes." />
      </CardContent>
    </Card>
  )
}
