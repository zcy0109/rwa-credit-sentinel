import { createHash } from "node:crypto";
import dotenv from "dotenv";
import {
  defaultVaultPolicy,
  evaluateExecution,
  type ExecutionContext,
  type RiskReport
} from "@rwa-sentinel/shared";
import { createExecutionIntentAdapterFromEnv, readCasperConfig } from "../src/index.js";

dotenv.config({ path: new URL("../../../.env", import.meta.url), quiet: true });
dotenv.config({ quiet: true });

const report: RiskReport = {
  assetId: "invoice:demo-acme-batch",
  request: {
    assetName: "Acme Invoice Batch",
    assetType: "invoice",
    requestedAmountUsd: 125_000,
    maturityDays: 45,
    debtorName: "Acme Manufacturing",
    debtorCountry: "US",
    description: "Verified invoice batch used for the finals execution-intent proof.",
    publicEvidenceUrls: [
      "https://example.com/invoice-batch",
      "https://example.com/purchase-orders",
      "https://example.com/delivery-records"
    ]
  },
  riskScore: 78,
  decision: "eligible",
  confidence: 92,
  factors: [],
  agentTrace: [],
  evidenceHash: "4df81df9ea02d7448837e020ba84ebc45904cf52adeefe628cb31f5aa8f65d0aa",
  reportHash: "9fd81df9ea02d7448837e020ba84ebc45904cf52adeefe628cb31f5aa8f65d0ed",
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
