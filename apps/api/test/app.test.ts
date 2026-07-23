import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { credentialRegistry } from "../src/services/credentialRegistry.js";
import { executionRegistry } from "../src/services/executionRegistry.js";

describe("RWA Credit Sentinel API", () => {
  beforeEach(() => {
    credentialRegistry.clear();
    executionRegistry.clear();
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

  it("turns a stored credential into a bounded execution intent", async () => {
    const app = createApp();
    const createResponse = await request(app)
      .post("/api/reports")
      .send({
        assetName: "Finals Invoice Pool",
        assetType: "invoice",
        requestedAmountUsd: 125000,
        maturityDays: 30,
        debtorName: "Verified Buyer",
        debtorCountry: "US",
        description: "A recurring invoice pool with verified purchase orders and payment history.",
        publicEvidenceUrls: [
          "https://example.com/invoice",
          "https://example.com/order",
          "https://example.com/history"
        ]
      })
      .expect(200);

    const executionResponse = await request(app)
      .post("/api/execution/evaluate")
      .send({
        assetId: createResponse.body.report.assetId,
        context: {
          mode: "autonomous",
          collateralRatio: 1.36,
          proposedAdvanceRatePercent: 68,
          liquidityBufferPercent: 31,
          evidenceFreshness: 92,
          credentialVerified: true,
          reportHashVerified: true,
          covenantBreach: false
        }
      })
      .expect(200);

    expect(executionResponse.body.evaluation.intent.assetId).toBe(createResponse.body.report.assetId);
    expect(executionResponse.body.evaluation.checks).toHaveLength(9);
    expect(executionResponse.body.evaluation.principalCapUsd).toBeGreaterThan(0);
    expect(executionResponse.body.evaluation.intent.policySnapshot.maxExposurePercent).toBe(18);

    const anchorResponse = await request(app)
      .post("/api/execution/anchor")
      .send({ intentId: executionResponse.body.evaluation.intent.intentId })
      .expect(200);

    expect(anchorResponse.body.intentHash).toMatch(/^[a-f0-9]{64}$/);
    expect(anchorResponse.body.attestation.entryPoint).toBe("record_execution_intent");
    expect(anchorResponse.body.attestation.transactionHash).toContain("mock-");
    expect(anchorResponse.body.idempotent).toBe(false);

    const repeatAnchorResponse = await request(app)
      .post("/api/execution/anchor")
      .send({ intentId: executionResponse.body.evaluation.intent.intentId })
      .expect(200);
    expect(repeatAnchorResponse.body.idempotent).toBe(true);
    expect(repeatAnchorResponse.body.attestation.transactionHash).toBe(
      anchorResponse.body.attestation.transactionHash
    );

    const intentResponse = await request(app)
      .get(`/api/execution/intents/${executionResponse.body.evaluation.intent.intentId}`)
      .expect(200);
    expect(intentResponse.body.intentHash).toBe(anchorResponse.body.intentHash);

    const benchmarkResponse = await request(app).get("/api/execution/benchmark").expect(200);
    expect(benchmarkResponse.body.sampleCount).toBe(30);
    expect(benchmarkResponse.body.agreementRate).toBe(100);
  });

  it("enforces the server policy instead of accepting caller-supplied limits", async () => {
    const app = createApp();
    const createResponse = await request(app)
      .post("/api/reports")
      .send({
        assetName: "Policy Locked Pool",
        assetType: "invoice",
        requestedAmountUsd: 125000,
        maturityDays: 30,
        debtorName: "Verified Buyer",
        debtorCountry: "US",
        description: "A recurring invoice pool with verified public evidence references.",
        publicEvidenceUrls: [
          "https://example.com/invoice",
          "https://example.com/order",
          "https://example.com/history"
        ]
      })
      .expect(200);

    const response = await request(app)
      .post("/api/execution/evaluate")
      .send({
        assetId: createResponse.body.report.assetId,
        context: {
          mode: "autonomous",
          collateralRatio: 1.36,
          proposedAdvanceRatePercent: 68,
          liquidityBufferPercent: 31,
          evidenceFreshness: 92,
          credentialVerified: true,
          reportHashVerified: true,
          covenantBreach: false
        },
        policy: {
          vaultLiquidityUsd: 999999999,
          maxExposurePercent: 100,
          minimumRiskScore: 0,
          autonomousRiskScore: 0,
          minimumCollateralRatio: 0.01,
          maximumAdvanceRatePercent: 100,
          minimumLiquidityBufferPercent: 0,
          minimumEvidenceFreshness: 0
        }
      })
      .expect(200);

    expect(response.body.evaluation.intent.policySnapshot).toMatchObject({
      vaultLiquidityUsd: 1250000,
      maxExposurePercent: 18,
      minimumRiskScore: 58,
      autonomousRiskScore: 76
    });
  });
});
