import { PortalShell } from '@/components/layout/PortalShell'

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalShell role="TEACHER" title="Teacher" subtitle="Classroom tools and insights">
      {children}
    </PortalShell>
  )
}
