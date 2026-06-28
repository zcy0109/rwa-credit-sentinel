import { describe, expect, it } from "vitest";
import { buildRiskRegistryCallPreview, toRiskRegistryRecordArgs } from "../src/registryContract.js";

describe("risk registry contract argument mapping", () => {
  it("maps a risk credential into Casper registry arguments", () => {
    const createdAtMs = 1_798_900_000_000;
    const args = toRiskRegistryRecordArgs({
      assetId: "invoice:acme-batch",
      riskScore: 72,
      decision: "review",
      reportHash: "report-hash",
      evidenceHash: "evidence-hash",
      createdAtMs
    });

    expect(args).toMatchObject({
      asset_id: "invoice:acme-batch",
      risk_score: 72,
      decision: "Review",
      report_hash: "report-hash",
      evidence_hash: "evidence-hash",
      created_at_ms: createdAtMs
    });
  });

  it("builds a contract-call preview for the registry entry point", () => {
    const preview = buildRiskRegistryCallPreview(
      {
        assetId: "invoice:acme-batch",
        riskScore: 86,
        decision: "eligible",
        reportHash: "report-hash",
        evidenceHash: "evidence-hash"
      },
      "hash-test-registry"
    );

    expect(preview).toMatchObject({
      contractHash: "hash-test-registry",
      entryPoint: "record_credential",
      status: "ready-for-contract-call",
      args: {
        decision: "Eligible",
        risk_score: 86
      }
    });
  });
});
