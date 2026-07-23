import { describe, expect, it } from "vitest";
import {
  defaultVaultPolicy,
  evaluateExecution,
  runExecutionBenchmark,
  type ExecutionContext,
  type RiskReport
} from "../src/index.js";

const report: RiskReport = {
  assetId: "invoice:demo-acme-batch",
  request: {
    assetName: "Acme Invoice Batch",
    assetType: "invoice",
    requestedAmountUsd: 125_000,
    maturityDays: 45,
    debtorName: "Acme Manufacturing",
    debtorCountry: "US",
    description: "A verified invoice batch used to test bounded lending execution.",
    publicEvidenceUrls: ["https://example.com/invoice", "https://example.com/order"]
  },
  riskScore: 78,
  decision: "eligible",
  confidence: 91,
  factors: [],
  agentTrace: [],
  evidenceHash: "e".repeat(64),
  reportHash: "r".repeat(64),
  createdAt: "2026-07-23T00:00:00.000Z"
};

const context: ExecutionContext = {
  mode: "autonomous",
  collateralRatio: 1.36,
  proposedAdvanceRatePercent: 68,
  liquidityBufferPercent: 31,
  evidenceFreshness: 92,
  credentialVerified: true,
  reportHashVerified: true,
  covenantBreach: false
};

describe("bounded execution policy", () => {
  it("approves a verified request inside every boundary", () => {
    const result = evaluateExecution(report, context, defaultVaultPolicy);
    expect(result.decision).toBe("approve");
    expect(result.authorization).toBe("policy_key");
    expect(result.principalCapUsd).toBeGreaterThan(0);
    expect(result.checks.every((check) => check.passed)).toBe(true);
  });

  it("blocks an invalid credential before allocating capital", () => {
    const result = evaluateExecution(report, { ...context, credentialVerified: false }, defaultVaultPolicy);
    expect(result.decision).toBe("block");
    expect(result.principalCapUsd).toBe(0);
    expect(result.intent.failedChecks).toContain("credential");
  });

  it("routes soft policy exceptions to reviewer multisig", () => {
    const result = evaluateExecution(report, { ...context, collateralRatio: 1.1 }, defaultVaultPolicy);
    expect(result.decision).toBe("review");
    expect(result.authorization).toBe("reviewer_multisig");
  });

  it("covers 30 deterministic benchmark cases", () => {
    const benchmark = runExecutionBenchmark();
    expect(benchmark.sampleCount).toBe(30);
    expect(benchmark.agreementRate).toBe(100);
    expect(benchmark.invalidCredentialBlockRate).toBe(100);
    expect(benchmark.coveredChecks).toEqual([
      "advance_rate",
      "collateral",
      "covenant",
      "credential",
      "evidence_freshness",
      "exposure",
      "liquidity_buffer",
      "report_hash",
      "risk_score"
    ]);
  });
});
