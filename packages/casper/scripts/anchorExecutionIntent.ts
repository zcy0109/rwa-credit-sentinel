import { createHash } from "node:crypto";
import dotenv from "dotenv";
import {
  defaultVaultPolicy,
  evaluateExecution,
  finalsEvidence,
  SAMPLE_EVIDENCE_BUNDLE_ID,
  type ExecutionContext,
  type RiskReport
} from "@rwa-sentinel/shared";
import { createExecutionIntentAdapterFromEnv, readCasperConfig } from "../src/index.js";

dotenv.config({ path: new URL("../../../.env", import.meta.url), quiet: true });
dotenv.config({ quiet: true });

const report: RiskReport = {
  assetId: finalsEvidence.assetId,
  request: {
    assetName: "Acme Export Invoice Pool Finals",
    assetType: "invoice",
    requestedAmountUsd: 125_000,
    maturityDays: 30,
    debtorName: "Acme Manufacturing",
    debtorCountry: "US",
    description:
      "A recurring invoice pool backed by verified purchase orders, delivery confirmations, and a predictable payment history from an established industrial buyer.",
    publicEvidenceUrls: [
      "https://example.com/invoice-batch",
      "https://example.com/purchase-orders",
      "https://example.com/delivery-records",
      "https://example.com/payment-history"
    ],
    evidenceBundleId: SAMPLE_EVIDENCE_BUNDLE_ID
  },
  riskScore: 80,
  decision: "eligible",
  confidence: 92,
  factors: [],
  agentTrace: [],
  evidenceHash: finalsEvidence.evidenceHash,
  reportHash: finalsEvidence.reportHash,
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

const evaluation = evaluateExecution(report, context, defaultVaultPolicy);
if (evaluation.decision !== "approve" || evaluation.principalCapUsd <= 0) {
  throw new Error("The published finals sample must produce a bounded approve decision.");
}

const intentHash = createHash("sha256")
  .update(JSON.stringify(canonicalize(evaluation.intent)))
  .digest("hex");
const adapter = createExecutionIntentAdapterFromEnv();
const config = readCasperConfig(process.env);
const attestation = await adapter.anchorExecutionIntent(evaluation.intent, intentHash);

console.log(
  JSON.stringify(
    {
      mode: config.mode,
      policyResult: {
        decision: evaluation.decision,
        authorization: evaluation.authorization,
        principalCapUsd: evaluation.principalCapUsd,
        checksPassed: evaluation.checks.filter((item) => item.passed).length,
        checksTotal: evaluation.checks.length
      },
      intent: evaluation.intent,
      intentHash,
      attestation
    },
    null,
    2
  )
);

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, canonicalize(child)])
    );
  }
  return value;
}
