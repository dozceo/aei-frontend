import { backendPost } from "@/lib/backend-client";

export async function provisionSchoolMembership(): Promise<{
  provisioned: boolean;
  role?: string;
  schoolId?: string;
  bookingId?: string;
  childIds?: string[];
}> {
  return backendPost("/api/school/provision");
}

export async function refreshSchoolClaims(): Promise<{ claims: Record<string, unknown> }> {
  return backendPost("/api/school/refresh-claims");
}
