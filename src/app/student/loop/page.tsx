"use client";

import { DatabaseState } from "@/components/layout/DatabaseState";
import { RoleShell } from "@/components/layout/RoleShell";
import { SankalpLoopPortal } from "@/components/portals/student/StudentPortalPanels";
import { useParticipant } from "@/hooks/useParticipant";
import { studentNav } from "@/lib/role-nav";

export default function StudentLoopPage() {
  const { participant, loading, error, bookingId } = useParticipant();

  return (
    <RoleShell title="Sankalp Loop" subtitle="7-step daily study path" eyebrow="Student" navItems={studentNav} activePath="/student/loop" accent="sky">
      {!participant ? (
        <DatabaseState loading={loading} error={error} pathHint={`participants/${bookingId}`} />
      ) : (
        <SankalpLoopPortal />
      )}
    </RoleShell>
  );
}
