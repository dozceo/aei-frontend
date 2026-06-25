"use client";

import { RoleShell } from "@/components/layout/RoleShell";
import { AdminRosterPortal } from "@/components/portals/admin/AdminPortalPanels";
import { adminNav } from "@/lib/role-nav";

export default function AdminRosterPage() {
  return (
    <RoleShell title="Roster" subtitle="School-scoped participant list" eyebrow="Admin" navItems={adminNav} activePath="/admin/roster" accent="sage">
      <AdminRosterPortal />
    </RoleShell>
  );
}
