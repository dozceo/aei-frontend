import { getRoleHome, normalizeRole } from "@/lib/auth";

describe("auth routing", () => {
  it("normalizes known roles", () => {
    expect(normalizeRole("STUDENT")).toBe("STUDENT");
    expect(normalizeRole("ADMIN")).toBe("ADMIN");
    expect(normalizeRole("invalid")).toBeNull();
  });

  it("maps roles to home paths", () => {
    expect(getRoleHome("STUDENT")).toBe("/student/dashboard");
    expect(getRoleHome("ADMIN")).toBe("/admin");
    expect(getRoleHome(null)).toBe("/onboarding");
  });
});
