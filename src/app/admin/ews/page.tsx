"use client";

import { RoleShell } from "@/components/layout/RoleShell";
import { AdminEwsPortal } from "@/components/portals/admin/AdminPortalPanels";
import { adminNav } from "@/lib/role-nav";

export default function AdminEwsPage() {
  return (
    <RoleShell title="Early Warning" subtitle="Cohort risk intelligence" eyebrow="Admin" navItems={adminNav} activePath="/admin/ews" accent="coral">
      <AdminEwsPortal />
    </RoleShell>
  );
}
