import type { RiskReport } from "./index.js";

export type ExecutionMode = "autonomous" | "human_in_loop" | "simulation";
export type ExecutionDecision = "approve" | "review" | "block";
export type CheckSeverity = "hard" | "soft";

export type VaultPolicy = {
  vaultLiquidityUsd: number;
  maxExposurePercent: number;
  minimumRiskScore: number;
  autonomousRiskScore: number;
  minimumCollateralRatio: number;
  maximumAdvanceRatePercent: number;
  minimumLiquidityBufferPercent: number;
  minimumEvidenceFreshness: number;
};

export type ExecutionContext = {
  mode: ExecutionMode;
  collateralRatio: number;
  proposedAdvanceRatePercent: number;
  liquidityBufferPercent: number;
  evidenceFreshness: number;
  credentialVerified: boolean;
  reportHashVerified: boolean;
  covenantBreach: boolean;
};

export type PolicyCheck = {
  id: string;
  label: string;
  passed: boolean;
  severity: CheckSeverity;
  actual: string;
  requirement: string;
};

export type ExecutionAgentStep = {
  agent: "Credential Agent" | "Policy Agent" | "Capital Agent" | "Execution Agent";
  status: "passed" | "attention" | "blocked";
  summary: string;
};

export type ExecutionIntent = {
  schemaVersion: "rwa-execution-intent/v1";
  intentId: string;
  assetId: string;
  reportHash: string;
  decision: ExecutionDecision;
  authorization: "policy_key" | "reviewer_multisig" | "none";
  mode: ExecutionMode;
  requestedAmountUsd: number;
  principalCapUsd: number;
  failedChecks: string[];
  policySnapshot: VaultPolicy;
};

export type ExecutionEvaluation = {
  decision: ExecutionDecision;
  authorization: ExecutionIntent["authorization"];
  principalCapUsd: number;
  requestedExposurePercent: number;
  checks: PolicyCheck[];
  trace: ExecutionAgentStep[];
  intent: ExecutionIntent;
  explanation: string;
};

export const defaultVaultPolicy: VaultPolicy = {
  vaultLiquidityUsd: 1_250_000,
  maxExposurePercent: 18,
  minimumRiskScore: 58,
  autonomousRiskScore: 76,
  minimumCollateralRatio: 1.15,
  maximumAdvanceRatePercent: 80,
  minimumLiquidityBufferPercent: 15,
  minimumEvidenceFreshness: 70
};

export function evaluateExecution(
  report: RiskReport,
  context: ExecutionContext,
  policy: VaultPolicy = defaultVaultPolicy
): ExecutionEvaluation {
  const requestedExposurePercent = round(
    (report.request.requestedAmountUsd / policy.vaultLiquidityUsd) * 100,
    1
  );
  const checks: PolicyCheck[] = [
    check("credential", "Casper credential verified", context.credentialVerified, "hard", "verified", context.credentialVerified ? "verified" : "unverified"),
    check("report_hash", "Report hash matches credential", context.reportHashVerified, "hard", "exact hash match", context.reportHashVerified ? "matched" : "mismatch"),
    check("covenant", "No active covenant breach", !context.covenantBreach, "hard", "no breach", context.covenantBreach ? "breach detected" : "clear"),
    check("risk_score", "Risk score floor", report.riskScore >= policy.minimumRiskScore, "hard", `>= ${policy.minimumRiskScore}`, String(report.riskScore)),
    check("collateral", "Collateral coverage", context.collateralRatio >= policy.minimumCollateralRatio, "soft", `>= ${policy.minimumCollateralRatio.toFixed(2)}x`, `${context.collateralRatio.toFixed(2)}x`),
    check("advance_rate", "Advance rate ceiling", context.proposedAdvanceRatePercent <= policy.maximumAdvanceRatePercent, "soft", `<= ${policy.maximumAdvanceRatePercent}%`, `${context.proposedAdvanceRatePercent}%`),
    check("liquidity_buffer", "Liquidity buffer", context.liquidityBufferPercent >= policy.minimumLiquidityBufferPercent, "soft", `>= ${policy.minimumLiquidityBufferPercent}%`, `${context.liquidityBufferPercent}%`),
    check("evidence_freshness", "Evidence freshness", context.evidenceFreshness >= policy.minimumEvidenceFreshness, "soft", `>= ${policy.minimumEvidenceFreshness}`, String(context.evidenceFreshness)),
    check("exposure", "Single-asset exposure", requestedExposurePercent <= policy.maxExposurePercent, "soft", `<= ${policy.maxExposurePercent}%`, `${requestedExposurePercent}%`)
  ];

  const hardFailures = checks.filter((item) => !item.passed && item.severity === "hard");
  const softFailures = checks.filter((item) => !item.passed && item.severity === "soft");
  let decision: ExecutionDecision = "block";

  if (hardFailures.length === 0 && softFailures.length === 0) {
    decision =
      report.riskScore >= policy.autonomousRiskScore && context.mode === "autonomous"
        ? "approve"
        : "review";
  } else if (hardFailures.length === 0 && softFailures.length <= 2) {
    decision = "review";
  }

  const policyCapacity =
    policy.vaultLiquidityUsd *
    (policy.maxExposurePercent / 100) *
    Math.min(1, report.riskScore / 100) *
    Math.min(1, context.collateralRatio / 1.25);
  const principalCapUsd =
    decision === "block"
      ? 0
      : Math.round(Math.min(report.request.requestedAmountUsd, policyCapacity));
  const authorization: ExecutionIntent["authorization"] =
    decision === "approve"
      ? "policy_key"
      : decision === "review"
        ? "reviewer_multisig"
        : "none";
  const failedChecks = checks.filter((item) => !item.passed).map((item) => item.id);
  const intentId = createIntentId(report, context, policy, decision, principalCapUsd);
  const intent: ExecutionIntent = {
    schemaVersion: "rwa-execution-intent/v1",
    intentId,
    assetId: report.assetId,
    reportHash: report.reportHash,
    decision,
    authorization,
    mode: context.mode,
    requestedAmountUsd: report.request.requestedAmountUsd,
    principalCapUsd,
    failedChecks,
    policySnapshot: policy
  };

  return {
    decision,
    authorization,
    principalCapUsd,
    requestedExposurePercent,
    checks,
    trace: buildTrace(report, decision, failedChecks, principalCapUsd, context),
    intent,
    explanation: explainDecision(decision, context.mode, failedChecks)
  };
}

function check(
  id: string,
  label: string,
  passed: boolean,
  severity: CheckSeverity,
  requirement: string,
  actual: string
): PolicyCheck {
  return { id, label, passed, severity, requirement, actual };
}

function buildTrace(
  report: RiskReport,
  decision: ExecutionDecision,
  failedChecks: string[],
  principalCapUsd: number,
  context: ExecutionContext
): ExecutionAgentStep[] {
  return [
    {
      agent: "Credential Agent",
      status: context.credentialVerified && context.reportHashVerified ? "passed" : "blocked",
      summary:
        context.credentialVerified && context.reportHashVerified
          ? `Consumed the verified Casper credential for ${report.assetId}.`
          : "Stopped autonomous execution because the credential proof is incomplete."
    },
    {
      agent: "Policy Agent",
      status: failedChecks.length === 0 ? "passed" : decision === "block" ? "blocked" : "attention",
      summary:
        failedChecks.length === 0
          ? "All credential, collateral, evidence, and exposure boundaries passed."
          : `Raised ${failedChecks.length} policy exception(s): ${failedChecks.join(", ")}.`
    },
    {
      agent: "Capital Agent",
      status: principalCapUsd > 0 ? "passed" : "blocked",
      summary:
        principalCapUsd > 0
          ? `Capped executable principal at $${principalCapUsd.toLocaleString("en-US")}.`
          : "Allocated no capital while hard policy checks remain unresolved."
    },
    {
      agent: "Execution Agent",
      status: decision === "approve" ? "passed" : decision === "review" ? "attention" : "blocked",
      summary:
        decision === "approve"
          ? "Prepared a policy-key lending intent for autonomous anchoring on Casper."
          : decision === "review"
            ? "Prepared a reviewer-multisig intent without moving funds."
            : "Prepared a blocked-intent audit record without execution authority."
    }
  ];
}

function explainDecision(
  decision: ExecutionDecision,
  mode: ExecutionMode,
  failedChecks: string[]
): string {
  if (decision === "approve") {
    return "The credential and every vault boundary passed, so the agent may anchor an execution intent under the policy key.";
  }

  if (decision === "review") {
    return mode === "simulation"
      ? "The request is financeable, but simulation mode requires a human-approved execution path."
      : `The request remains financeable but needs reviewer multisig approval${failedChecks.length ? ` for ${failedChecks.join(", ")}` : ""}.`;
  }

  return `Execution is blocked because hard safety boundaries failed: ${failedChecks.join(", ")}.`;
}

function createIntentId(
  report: RiskReport,
  context: ExecutionContext,
  policy: VaultPolicy,
  decision: ExecutionDecision,
  principalCapUsd: number
): string {
  const payload = JSON.stringify({
    assetId: report.assetId,
    reportHash: report.reportHash,
    context,
    policy,
    decision,
    principalCapUsd
  });
  let hash = 2166136261;
  for (let index = 0; index < payload.length; index += 1) {
    hash ^= payload.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `intent-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function round(value: number, digits: number): number {
  const multiplier = 10 ** digits;
  return Math.round(value * multiplier) / multiplier;
}
