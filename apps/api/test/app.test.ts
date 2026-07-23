import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { credentialRegistry } from "../src/services/credentialRegistry.js";
import { executionRegistry } from "../src/services/executionRegistry.js";
import { clearUploadedEvidenceBundles } from "../src/services/evidenceBundle.js";

describe("RWA Credit Sentinel API", () => {
  beforeEach(() => {
    credentialRegistry.clear();
    executionRegistry.clear();
    clearUploadedEvidenceBundles();
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

  it("exposes judge-readable verification of the published Casper state", async () => {
    const app = createApp({
      verifyFinalsState: async () => ({
        verified: true,
        verifiedAt: "2026-07-23T12:00:00.000Z",
        contractHash: "contract-hash",
        packageHash: "package-hash",
        credential: {
          dictionaryKey: "dictionary-risk",
          stateRootHash: "state-root",
          record: {
            asset_id: "invoice:demo",
            risk_score: 78,
            decision: "Eligible",
            report_hash: "report",
            evidence_hash: "evidence",
            issuer: "AccountHash(issuer)",
            created_at_ms: 100
          },
          checks: []
        },
        executionIntent: {
          dictionaryKey: "dictionary-intent",
          stateRootHash: "state-root",
          record: {
            intent_id: "intent-01",
            asset_id: "invoice:demo",
            report_hash: "report",
            decision: "Approve",
            authorization: "policy_key",
            principal_cap_usd: 125000,
            intent_hash: "intent-hash",
            issuer: "AccountHash(issuer)",
            created_at_ms: 200
          },
          checks: []
        }
      })
    });

    const response = await request(app).get("/api/casper/verify-finals").expect(200);
    expect(response.body.verified).toBe(true);
    expect(response.body.executionIntent.record.principal_cap_usd).toBe(125000);
  });

  it("binds the sample underwriting report to content-level evidence hashes", async () => {
    const app = createApp();
    const bundleResponse = await request(app).get("/api/evidence/sample").expect(200);
    const reportResponse = await request(app)
      .post("/api/reports")
      .send({
        assetName: "Content Hashed Pool",
        assetType: "invoice",
        requestedAmountUsd: 125000,
        maturityDays: 30,
        debtorName: "Acme Manufacturing",
        debtorCountry: "US",
        description: "A sample invoice pool backed by a content-hashed synthetic evidence package.",
        publicEvidenceUrls: [],
        evidenceBundleId: "acme-export-invoice-pool-v1"
      })
      .expect(200);

    expect(bundleResponse.body.manifest.documentCount).toBe(4);
    expect(reportResponse.body.report.evidenceManifest.manifestHash).toBe(
      bundleResponse.body.manifest.manifestHash
    );
    expect(reportResponse.body.report.agentTrace[0].outputs.contentHashed).toBe(true);
  });

  it("turns uploaded evidence into a server-hashed decision receipt", async () => {
    const app = createApp();
    const intakeResponse = await request(app)
      .post("/api/evidence/intake")
      .send({
        label: "Pilot invoice register",
        files: [
          {
            name: "invoice-register.json",
            mediaType: "application/json",
            evidenceType: "invoice_register",
            contentBase64: Buffer.from(
              JSON.stringify([{ invoiceNumber: "INV-001", amount: 125000 }])
            ).toString("base64")
          }
        ]
      })
      .expect(200);

    expect(intakeResponse.body.manifest.synthetic).toBe(false);
    expect(intakeResponse.body.claimVerification).toBe("not-performed");

    const reportResponse = await request(app)
      .post("/api/reports")
      .send({
        assetName: "Uploaded Evidence Pool",
        assetType: "invoice",
        requestedAmountUsd: 125000,
        maturityDays: 30,
        debtorName: "Pilot Buyer",
        debtorCountry: "US",
        description: "An invoice pool submitted through the bounded evidence intake flow.",
        publicEvidenceUrls: [],
        evidenceBundleId: intakeResponse.body.manifest.bundleId
      })
      .expect(200);

    const executionResponse = await request(app)
      .post("/api/execution/evaluate")
      .send({
        assetId: reportResponse.body.report.assetId,
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

    const anchorResponse = await request(app)
      .post("/api/execution/anchor")
      .send({ intentId: executionResponse.body.evaluation.intent.intentId })
      .expect(200);
    const receiptResponse = await request(app)
      .get(`/api/execution/receipts/${anchorResponse.body.evaluation.intent.intentId}`)
      .expect(200);

    expect(receiptResponse.body.receiptHash).toMatch(/^[a-f0-9]{64}$/);
    expect(receiptResponse.body.evidenceIntegrity.status).toBe("user-submitted-content");
    expect(receiptResponse.body.evidenceIntegrity.claimVerification).toBe("not-performed");
    expect(receiptResponse.body.agentSystem.provenance.privateKeyAccess).toBe(false);
    expect(receiptResponse.body.agentSystem.policyBenchmark.scope).toBe(
      "deterministic policy-conformance"
    );
    expect(receiptResponse.body.safety.movesFunds).toBe(false);

    const receiptDownload = await request(app)
      .get(`/api/execution/receipts/${anchorResponse.body.evaluation.intent.intentId}?download=1`)
      .expect("Content-Disposition", /attachment; filename="rwa-decision-receipt-/)
      .expect(200);
    expect(receiptDownload.body.receiptHash).toBe(receiptResponse.body.receiptHash);
  });
});
