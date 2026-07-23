import { describe, expect, it } from "vitest";
import { toExecutionIntentRecordArgs } from "../src/index.js";

describe("execution intent contract args", () => {
  it("maps a bounded intent to Casper entry-point arguments", () => {
    const args = toExecutionIntentRecordArgs(
      {
        schemaVersion: "rwa-execution-intent/v1",
        intentId: "intent-demo-01",
        assetId: "invoice:demo",
        reportHash: "a".repeat(64),
        decision: "approve",
        authorization: "policy_key",
        mode: "autonomous",
        requestedAmountUsd: 125000,
        principalCapUsd: 125000,
        failedChecks: [],
        policySnapshot: {
          vaultLiquidityUsd: 1250000,
          maxExposurePercent: 18,
          minimumRiskScore: 58,
          autonomousRiskScore: 76,
          minimumCollateralRatio: 1.15,
          maximumAdvanceRatePercent: 80,
          minimumLiquidityBufferPercent: 15,
          minimumEvidenceFreshness: 70
        }
      },
      "b".repeat(64),
      1784772000000
    );

    expect(args.decision).toBe("Approve");
    expect(args.principal_cap_usd).toBe(125000);
    expect(args.intent_hash).toHaveLength(64);
  });
});
