import {
  decideFinancingGate,
  type AgentStep,
  type EvidenceManifest,
  type FinancingRequest,
  type RiskFactor,
  type RiskReport
} from "@rwa-sentinel/shared";
import { sha256Hex } from "./hash.js";

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function createAssetId(request: FinancingRequest): string {
  return `${request.assetType}:${request.assetName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`.replace(/-$/, "");
}

function scoreRequest(request: FinancingRequest, evidenceManifest?: EvidenceManifest): RiskFactor[] {
  const maturityScore = clampScore(100 - Math.max(0, request.maturityDays - 30) * 0.9);
  const evidenceItems = evidenceManifest?.documentCount ?? request.publicEvidenceUrls.length;
  const evidenceScore = clampScore(45 + evidenceItems * 18);
  const amountScore = clampScore(100 - Math.log10(Math.max(request.requestedAmountUsd, 1)) * 8);
  const debtorScore = clampScore(request.debtorCountry.length >= 2 ? 72 : 40);
  const descriptionScore = clampScore(Math.min(92, 38 + request.description.length / 8));

  return [
    {
      id: "maturity",
      label: "Maturity risk",
      score: maturityScore,
      rationale: "Shorter maturities reduce repayment uncertainty for an RWA financing pool."
    },
    {
      id: "evidence",
      label: "Evidence coverage",
      score: evidenceScore,
      rationale: "More public evidence improves verifiability for off-chain asset claims."
    },
    {
      id: "amount",
      label: "Exposure size",
      score: amountScore,
      rationale: "Larger requested amounts require more conservative automated advance limits."
    },
    {
      id: "debtor",
      label: "Debtor identity completeness",
      score: debtorScore,
      rationale: "The debtor profile is present and can be used for manual or automated checks."
    },
    {
      id: "narrative",
      label: "Asset narrative completeness",
      score: descriptionScore,
      rationale: "A complete asset narrative helps the risk agent explain the financing request."
    }
  ];
}

function weightedScore(factors: RiskFactor[]): number {
  const weights: Record<string, number> = {
    maturity: 0.18,
    evidence: 0.28,
    amount: 0.16,
    debtor: 0.18,
    narrative: 0.2
  };

  return clampScore(
    factors.reduce((sum, factor) => sum + factor.score * (weights[factor.id] ?? 0), 0)
  );
}

function buildAgentTrace(
  request: FinancingRequest,
  factors: RiskFactor[],
  riskScore: number,
  evidenceManifest?: EvidenceManifest
): AgentStep[] {
  const gate = decideFinancingGate(riskScore);
  const evidenceItems = evidenceManifest?.documentCount ?? request.publicEvidenceUrls.length;

  return [
    {
      agent: "Data Agent",
      tool: "normalize_financing_request",
      status: evidenceItems > 0 ? "completed" : "attention",
      summary: "Normalized the submitted RWA financing request and extracted verifiable evidence references.",
      outputs: {
        assetType: request.assetType,
        evidenceItems,
        contentHashed: Boolean(evidenceManifest),
        requestedAmountUsd: request.requestedAmountUsd
      }
    },
    {
      agent: "Risk Agent",
      tool: "score_rwa_credit_factors",
      status: "completed",
      summary: "Scored maturity, evidence coverage, exposure size, debtor completeness, and asset narrative quality.",
      outputs: {
        factorCount: factors.length,
        riskScore
      }
    },
    {
      agent: "Verification Agent",
      tool: "bind_sha256_evidence",
      status: evidenceItems > 0 ? "completed" : "attention",
      summary: "Prepared deterministic hashes so the off-chain report can be matched against a Casper attestation.",
      outputs: {
        verifiableEvidenceItems: evidenceItems,
        needsMoreEvidence: evidenceItems < 2,
        manifestHash: evidenceManifest?.manifestHash ?? "URL-reference-only"
      }
    },
    {
      agent: "Decision Agent",
      tool: "apply_financing_gate",
      status: gate.status === "rejected" ? "blocked" : gate.status === "review" ? "attention" : "completed",
      summary: "Mapped the risk credential to a DeFi financing gate outcome.",
      outputs: {
        decision: gate.status,
        maxAdvanceRate: gate.maxAdvanceRate
      }
    }
  ];
}

export async function buildRiskReport(
  request: FinancingRequest,
  evidenceManifest?: EvidenceManifest
): Promise<RiskReport> {
  const assetId = createAssetId(request);
  const factors = scoreRequest(request, evidenceManifest);
  const riskScore = weightedScore(factors);
  const gate = decideFinancingGate(riskScore);
  const createdAt = new Date().toISOString();
  const inputHash = await sha256Hex({
    request,
    evidenceManifestHash: evidenceManifest?.manifestHash ?? null
  });
  const agentTrace = buildAgentTrace(request, factors, riskScore, evidenceManifest);
  const evidenceHash = await sha256Hex({
    evidence: evidenceManifest
      ? { bundleId: evidenceManifest.bundleId, manifestHash: evidenceManifest.manifestHash }
      : { urls: request.publicEvidenceUrls },
    debtorName: request.debtorName,
    debtorCountry: request.debtorCountry
  });

  const unsignedReport = {
    assetId,
    request,
    riskScore,
    decision: gate.status,
    confidence: clampScore(
      50 + (evidenceManifest?.documentCount ?? request.publicEvidenceUrls.length) * 12
    ),
    factors,
    agentTrace,
    provenance: {
      schemaVersion: "rwa-agent-provenance/v1" as const,
      workflowVersion: "finals-v2" as const,
      runtimeMode: "bounded-deterministic" as const,
      inputHash,
      evidenceAuthority: "content-integrity-only" as const,
      decisionAuthority: "server-policy" as const,
      modelAuthority: "analysis-only" as const,
      privateKeyAccess: false as const
    },
    evidenceHash,
    evidenceManifest,
    createdAt
  };

  const reportHash = await sha256Hex(unsignedReport);

  return {
    ...unsignedReport,
    reportHash
  };
}
