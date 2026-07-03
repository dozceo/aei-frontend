import { PortalShell } from '@/components/layout/PortalShell'

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalShell role="STUDENT" title="Student" subtitle="Your daily learning hub">
      {children}
    </PortalShell>
  )
}
