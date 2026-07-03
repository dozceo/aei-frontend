import { PortalShell } from '@/components/layout/PortalShell'

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalShell role="PARENT" title="Parent" subtitle="Stay connected to your child's progress">
      {children}
    </PortalShell>
  )
}
