import { describe, expect, it, beforeEach } from "vitest";
import { buildRiskReport } from "../src/services/riskEngine.js";
import { credentialRegistry } from "../src/services/credentialRegistry.js";

describe("credentialRegistry", () => {
  beforeEach(() => {
    credentialRegistry.clear();
  });

  it("stores and retrieves a risk credential by asset id", async () => {
    const report = await buildRiskReport({
      assetName: "Acme Invoice Batch A",
      assetType: "invoice",
      requestedAmountUsd: 125000,
      maturityDays: 45,
      debtorName: "Acme Manufacturing",
      debtorCountry: "US",
      description: "Thirty invoices with purchase-order references.",
      publicEvidenceUrls: ["https://example.com/invoice-a"]
    });

    const saved = credentialRegistry.save({
      report,
      attestation: {
        assetId: report.assetId,
        riskScore: report.riskScore,
        decision: report.decision,
        reportHash: report.reportHash,
        evidenceHash: report.evidenceHash,
        issuer: "test",
        network: "mock",
        method: "mock",
        transactionHash: "mock-test",
        createdAt: new Date().toISOString()
      },
      registryCall: {
        entryPoint: "record_credential",
        status: "ready-for-contract-call",
        args: {
          asset_id: report.assetId,
          risk_score: report.riskScore,
          decision: "Review",
          report_hash: report.reportHash,
          evidence_hash: report.evidenceHash,
          created_at_ms: Date.now()
        }
      }
    });

    expect(credentialRegistry.get(report.assetId)).toEqual(saved);
    expect(credentialRegistry.list()).toHaveLength(1);
  });
});
