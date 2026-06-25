import { decide } from "@/lib/intelligence/ml/decision-engine";

describe("decision engine", () => {
  it("returns a category for high dropout risk", () => {
    const result = decide({
      mastery_probability: 0.4,
      dropout_probability: 0.85,
      forgetting_days: 3,
      attention_risk: "high",
      confidence_lower: 0.3,
      confidence_upper: 0.5,
    });
    expect(result.category).toBeDefined();
    expect(result.reasoning.length).toBeGreaterThan(0);
  });
});
