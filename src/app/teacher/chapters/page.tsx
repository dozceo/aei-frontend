import { Card, CardContent, CardDescription, CardHeader, CardTitle, EmptyState } from '@/components/design-system'

export default function TeacherChaptersPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Chapters</CardTitle>
        <CardDescription>Chapter content and CAG packs for AI tutoring.</CardDescription>
      </CardHeader>
      <CardContent>
        <EmptyState title="No chapters published" description="Chapters appear after admin publishes content." />
      </CardContent>
    </Card>
  )
}
