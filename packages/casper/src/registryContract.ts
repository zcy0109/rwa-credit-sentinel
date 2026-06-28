import type { AttestRiskCredentialInput } from "./index.js";

export type RegistryDecision = "Eligible" | "Review" | "Rejected";

export type RiskRegistryRecordArgs = {
  asset_id: string;
  risk_score: number;
  decision: RegistryDecision;
  report_hash: string;
  evidence_hash: string;
  created_at_ms: number;
};

export type RiskRegistryCallPreview = {
  contractHash?: string;
  entryPoint: typeof RISK_REGISTRY_ENTRY_POINTS.recordCredential;
  args: RiskRegistryRecordArgs;
  status: "ready-for-contract-call";
};

export const RISK_REGISTRY_ENTRY_POINTS = {
  recordCredential: "record_credential",
  getCredential: "get_credential",
  owner: "owner"
} as const;

export function buildRiskRegistryCallPreview(
  input: AttestRiskCredentialInput,
  contractHash?: string
): RiskRegistryCallPreview {
  return {
    contractHash,
    entryPoint: RISK_REGISTRY_ENTRY_POINTS.recordCredential,
    args: toRiskRegistryRecordArgs(input),
    status: "ready-for-contract-call"
  };
}

export function toRiskRegistryRecordArgs(input: AttestRiskCredentialInput): RiskRegistryRecordArgs {
  return {
    asset_id: input.assetId,
    risk_score: input.riskScore,
    decision: toRegistryDecision(input.decision),
    report_hash: input.reportHash,
    evidence_hash: input.evidenceHash,
    created_at_ms: input.createdAtMs ?? Date.now()
  };
}

function toRegistryDecision(decision: AttestRiskCredentialInput["decision"]): RegistryDecision {
  if (decision === "eligible") {
    return "Eligible";
  }

  if (decision === "rejected") {
    return "Rejected";
  }

  return "Review";
}
