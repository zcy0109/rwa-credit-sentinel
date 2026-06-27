import { describe, expect, it } from "vitest";
import { decideFinancingGate } from "../src/index.js";

describe("decideFinancingGate", () => {
  it("approves strong risk credentials", () => {
    const result = decideFinancingGate(82);

    expect(result.status).toBe("eligible");
    expect(result.maxAdvanceRate).toBe(0.75);
  });

  it("routes mid-risk credentials to manual review", () => {
    const result = decideFinancingGate(64);

    expect(result.status).toBe("review");
    expect(result.requiredReview).toContain("manual-underwriter-review");
  });

  it("rejects weak risk credentials", () => {
    const result = decideFinancingGate(35);

    expect(result.status).toBe("rejected");
    expect(result.maxAdvanceRate).toBe(0);
  });
});
