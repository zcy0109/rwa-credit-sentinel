import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { credentialRegistry } from "../src/services/credentialRegistry.js";

describe("RWA Credit Sentinel API", () => {
  beforeEach(() => {
    credentialRegistry.clear();
  });

  it("creates and exposes a risk credential through the API", async () => {
    const app = createApp();

    const createResponse = await request(app)
      .post("/api/reports")
      .send({
        assetName: "Acme Invoice Batch A",
        assetType: "invoice",
        requestedAmountUsd: 125000,
        maturityDays: 45,
        debtorName: "Acme Manufacturing",
        debtorCountry: "US",
        description:
          "Thirty invoices from a recurring industrial buyer with purchase-order references.",
        publicEvidenceUrls: ["https://example.com/invoice-a", "https://example.com/po-a"]
      })
      .expect(200);

    expect(createResponse.body.report.assetId).toBe("invoice:acme-invoice-batch-a");
    expect(createResponse.body.attestation.transactionHash).toContain("mock-");
    expect(createResponse.body.registryCall.entryPoint).toBe("record_credential");
    expect(createResponse.body.registryCall.args.asset_id).toBe("invoice:acme-invoice-batch-a");
    expect(createResponse.body.registryCall.args.decision).toBe("Review");

    const listResponse = await request(app).get("/api/credentials").expect(200);
    expect(listResponse.body.credentials).toHaveLength(1);
    expect(listResponse.body.credentials[0].registryCall.status).toBe("ready-for-contract-call");

    const getResponse = await request(app)
      .get("/api/credentials/invoice:acme-invoice-batch-a")
      .expect(200);
    expect(getResponse.body.report.reportHash).toBe(createResponse.body.report.reportHash);
  });
});
