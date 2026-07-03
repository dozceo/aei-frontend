import { Card, CardContent, CardDescription, CardHeader, CardTitle, EmptyState } from '@/components/design-system'

export default function StudentPlayPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Play</CardTitle>
        <CardDescription>Arcade-style practice and engagement games.</CardDescription>
      </CardHeader>
      <CardContent>
        <EmptyState
          title="Arcade coming soon"
          description="Games will appear here once your teacher publishes play sessions."
        />
      </CardContent>
    </Card>
  )
}
