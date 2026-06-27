export type AssetType = "invoice" | "trade_receivable" | "real_estate" | "commodity" | "other";

export type FinancingRequest = {
  assetName: string;
  assetType: AssetType;
  requestedAmountUsd: number;
  maturityDays: number;
  debtorName: string;
  debtorCountry: string;
  description: string;
  publicEvidenceUrls: string[];
};

export type RiskFactor = {
  id: string;
  label: string;
  score: number;
  rationale: string;
};

export type RiskDecision = "eligible" | "review" | "rejected";

export type AgentStep = {
  agent: "Data Agent" | "Risk Agent" | "Verification Agent" | "Decision Agent";
  summary: string;
  outputs: Record<string, string | number | boolean>;
};

export type RiskReport = {
  assetId: string;
  request: FinancingRequest;
  riskScore: number;
  decision: RiskDecision;
  confidence: number;
  factors: RiskFactor[];
  agentTrace: AgentStep[];
  evidenceHash: string;
  reportHash: string;
  createdAt: string;
};

export type CasperAttestation = {
  assetId: string;
  riskScore: number;
  decision: RiskDecision;
  reportHash: string;
  evidenceHash: string;
  issuer: string;
  network: "casper-testnet" | "mock";
  method: "native-transfer-memo" | "mock";
  transferId?: number;
  transactionHash: string;
  explorerUrl?: string;
  createdAt: string;
};

export type FinancingGateResult = {
  status: RiskDecision;
  maxAdvanceRate: number;
  requiredReview: string[];
  explanation: string;
};

export function decideFinancingGate(score: number): FinancingGateResult {
  if (score >= 76) {
    return {
      status: "eligible",
      maxAdvanceRate: 0.75,
      requiredReview: [],
      explanation: "Risk credential is strong enough for automated pool eligibility."
    };
  }

  if (score >= 51) {
    return {
      status: "review",
      maxAdvanceRate: 0.45,
      requiredReview: ["manual-underwriter-review", "debtor-verification"],
      explanation: "Risk credential is usable, but the financing request needs human review."
    };
  }

  return {
    status: "rejected",
    maxAdvanceRate: 0,
    requiredReview: ["risk-remediation", "new-evidence-required"],
    explanation: "Risk credential is below the financing pool threshold."
  };
}
