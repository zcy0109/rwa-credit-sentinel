import type { RiskReport } from "./index.js";
import {
  defaultVaultPolicy,
  evaluateExecution,
  type ExecutionContext,
  type ExecutionDecision
} from "./execution.js";

export type BenchmarkReport = {
  sampleCount: number;
  agreementRate: number;
  invalidCredentialBlockRate: number;
  distribution: Record<ExecutionDecision, number>;
  coveredChecks: string[];
};

type BenchmarkCase = {
  report: RiskReport;
  context: ExecutionContext;
  expected: ExecutionDecision;
};

export function runExecutionBenchmark(): BenchmarkReport {
  const cases = buildCases();
  const distribution: Record<ExecutionDecision, number> = { approve: 0, review: 0, block: 0 };
  const coveredChecks = new Set<string>();
  let agreement = 0;
  let invalidCredentialCount = 0;
  let invalidCredentialBlocked = 0;

  for (const item of cases) {
    const result = evaluateExecution(item.report, item.context, defaultVaultPolicy);
    distribution[result.decision] += 1;
    result.checks.filter((check) => !check.passed).forEach((check) => coveredChecks.add(check.id));
    if (result.decision === item.expected) agreement += 1;
    if (!item.context.credentialVerified) {
      invalidCredentialCount += 1;
      if (result.decision === "block") invalidCredentialBlocked += 1;
    }
  }

  return {
    sampleCount: cases.length,
    agreementRate: percent(agreement / cases.length),
    invalidCredentialBlockRate: percent(invalidCredentialBlocked / invalidCredentialCount),
    distribution,
    coveredChecks: [...coveredChecks].sort()
  };
}

function buildCases(): BenchmarkCase[] {
  const cases: BenchmarkCase[] = [];
  for (let index = 0; index < 10; index += 1) {
    cases.push(makeCase(index, "approve"));
    cases.push(makeCase(index + 10, "review"));
    cases.push(makeCase(index + 20, "block"));
  }
  return cases;
}

function makeCase(index: number, expected: ExecutionDecision): BenchmarkCase {
  const variant = index % 10;
  const riskScore = expected === "approve" ? 82 : expected === "block" && variant % 4 === 3 ? 48 : 66;
  const report = reportFixture(index, riskScore);
  const baseContext: ExecutionContext = {
    mode: "autonomous",
    collateralRatio: 1.32,
    proposedAdvanceRatePercent: 68,
    liquidityBufferPercent: 24,
    evidenceFreshness: 90,
    credentialVerified: true,
    reportHashVerified: true,
    covenantBreach: false
  };

  if (expected === "review") {
    const softFailure = variant % 5;
    if (softFailure === 0) baseContext.collateralRatio = 1.1;
    if (softFailure === 1) baseContext.proposedAdvanceRatePercent = 85;
    if (softFailure === 2) baseContext.liquidityBufferPercent = 10;
    if (softFailure === 3) baseContext.evidenceFreshness = 60;
    if (softFailure === 4) report.request.requestedAmountUsd = 300_000;
  }

  if (expected === "block") {
    const hardFailure = variant % 4;
    if (hardFailure === 0) baseContext.credentialVerified = false;
    if (hardFailure === 1) baseContext.reportHashVerified = false;
    if (hardFailure === 2) baseContext.covenantBreach = true;
  }

  return { report, context: baseContext, expected };
}

function reportFixture(index: number, riskScore: number): RiskReport {
  const reportHash = `${index.toString(16).padStart(2, "0")}${"a".repeat(62)}`;
  return {
    assetId: `invoice:benchmark-${index}`,
    request: {
      assetName: `Benchmark Invoice ${index}`,
      assetType: "invoice",
      requestedAmountUsd: 120_000 + index * 1_000,
      maturityDays: 45,
      debtorName: `Benchmark Debtor ${index}`,
      debtorCountry: "US",
      description: "Deterministic benchmark case for bounded lending execution.",
      publicEvidenceUrls: ["https://example.com/evidence"]
    },
    riskScore,
    decision: riskScore >= 76 ? "eligible" : riskScore >= 51 ? "review" : "rejected",
    confidence: 90,
    factors: [],
    agentTrace: [],
    evidenceHash: "b".repeat(64),
    reportHash,
    createdAt: "2026-07-23T00:00:00.000Z"
  };
}

function percent(value: number): number {
  return Math.round(value * 1000) / 10;
}
