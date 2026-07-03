import { Card, CardContent, CardDescription, CardHeader, CardTitle, EmptyState } from '@/components/design-system'

export default function TeacherTopicsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Topics</CardTitle>
        <CardDescription>Manage daily topics and recall slots.</CardDescription>
      </CardHeader>
      <CardContent>
        <EmptyState title="No topics yet" description="Publish topics from the admin console or schedule." />
      </CardContent>
    </Card>
  )
}
