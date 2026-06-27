import { describe, expect, it } from "vitest";
import { buildRiskReport } from "../src/services/riskEngine.js";

describe("buildRiskReport", () => {
  it("creates a deterministic risk report shape", async () => {
    const report = await buildRiskReport({
      assetName: "Acme Invoice Batch A",
      assetType: "invoice",
      requestedAmountUsd: 125000,
      maturityDays: 45,
      debtorName: "Acme Manufacturing",
      debtorCountry: "US",
      description: "Thirty invoices from a recurring industrial buyer with public purchase-order references.",
      publicEvidenceUrls: ["https://example.com/invoice-a", "https://example.com/po-a"]
    });

    expect(report.assetId).toBe("invoice:acme-invoice-batch-a");
    expect(report.riskScore).toBeGreaterThan(0);
    expect(report.reportHash).toHaveLength(64);
    expect(report.evidenceHash).toHaveLength(64);
    expect(report.agentTrace).toHaveLength(4);
  });
});
