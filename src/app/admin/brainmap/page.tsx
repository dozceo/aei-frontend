import { Card, CardContent, CardDescription, CardHeader, CardTitle, EmptyState } from '@/components/design-system'

export default function AdminBrainmapPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Brainmap</CardTitle>
        <CardDescription>Aggregated mastery maps and concept graphs.</CardDescription>
      </CardHeader>
      <CardContent>
        <EmptyState title="Brainmap pending" description="Maps generate after sufficient attempt data." />
      </CardContent>
    </Card>
  )
}
