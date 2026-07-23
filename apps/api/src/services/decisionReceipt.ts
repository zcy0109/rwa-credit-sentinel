import {
  finalsEvidence,
  runExecutionBenchmark
} from "@rwa-sentinel/shared";
import type { RiskCredentialRecord } from "./credentialRegistry.js";
import type { ExecutionIntentRecord } from "./executionRegistry.js";
import { sha256Hex } from "./hash.js";

export async function buildDecisionReceipt(
  credential: RiskCredentialRecord,
  execution: ExecutionIntentRecord
) {
  const manifest = credential.report.evidenceManifest;
  const unsignedReceipt = {
    schemaVersion: "rwa-decision-receipt/v1" as const,
    generatedAt: execution.anchoredAt ?? execution.evaluatedAt,
    purpose:
      "Audit receipt for an RWA underwriting decision and its policy-bounded execution intent.",
    asset: {
      assetId: credential.report.assetId,
      assetName: credential.report.request.assetName,
      assetType: credential.report.request.assetType,
      requestedAmountUsd: credential.report.request.requestedAmountUsd,
      debtorName: credential.report.request.debtorName
    },
    evidenceIntegrity: {
      evidenceHash: credential.report.evidenceHash,
      manifest: manifest ?? null,
      status: manifest?.synthetic
        ? "synthetic-demonstration"
        : manifest
          ? "user-submitted-content"
          : "url-references-only",
      claimVerification: "not-performed",
      statement:
        "SHA-256 digests prove that the assessed bytes or references did not change. They do not prove that commercial claims are true."
    },
    agentSystem: {
      provenance: credential.report.provenance ?? null,
      underwritingTrace: credential.report.agentTrace,
      executionTrace: execution.evaluation.trace,
      autonomyBoundary:
        "Agents analyze evidence and prepare intents. Deterministic server policy controls authorization and capital limits. Models never receive private keys.",
      policyBenchmark: {
        ...runExecutionBenchmark(),
        scope: "deterministic policy-conformance",
        limitation: "This benchmark is not a claim of credit-model accuracy."
      }
    },
    decision: {
      riskScore: credential.report.riskScore,
      riskDecision: credential.report.decision,
      confidence: credential.report.confidence,
      reportHash: credential.report.reportHash,
      executionDecision: execution.evaluation.decision,
      authorization: execution.evaluation.authorization,
      principalCapUsd: execution.evaluation.principalCapUsd,
      failedChecks: execution.evaluation.intent.failedChecks,
      policySnapshot: execution.evaluation.intent.policySnapshot
    },
    currentRunProof: {
      credential: credential.attestation,
      executionIntentHash: execution.intentHash ?? null,
      executionIntentAttestation: execution.attestation ?? null
    },
    publishedCasperFinalsProof: {
      network: "casper-testnet",
      contractHash: finalsEvidence.contractHash,
      packageHash: finalsEvidence.packageHash,
      deploymentTransaction: finalsEvidence.deploymentHash,
      credentialTransaction: finalsEvidence.credentialWriteHash,
      executionIntentTransaction: finalsEvidence.intentWriteHash,
      credentialDictionaryKey: finalsEvidence.credentialDictionaryKey,
      executionIntentDictionaryKey: finalsEvidence.intentDictionaryKey
    },
    safety: {
      movesFunds: false,
      custodial: false,
      investmentAdvice: false,
      productionCreditDecision: false,
      humanReviewPath:
        execution.evaluation.authorization === "reviewer_multisig" ||
        execution.evaluation.decision === "block"
    },
    limitations: [
      "Prototype for Buildathon evaluation; not a production lending system.",
      "Uploaded evidence is content-hashed but its commercial truth is not independently verified.",
      "Policy benchmark measures deterministic control behavior, not default prediction accuracy.",
      "No private KYC documents or real funds should be submitted."
    ]
  };

  return {
    ...unsignedReceipt,
    receiptHash: await sha256Hex(unsignedReceipt)
  };
}
