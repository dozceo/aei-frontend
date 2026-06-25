import { participantDivisionId } from "@/lib/intelligence/academic/class-identity";

describe("class identity", () => {
  it("prefers divisionId over classId", () => {
    expect(participantDivisionId({ divisionId: "8A", classId: "legacy" })).toBe("8A");
    expect(participantDivisionId({ classId: "legacy" })).toBe("legacy");
    expect(participantDivisionId({})).toBe("");
  });
});
