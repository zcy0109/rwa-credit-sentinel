import type { ExecutionIntent } from "@rwa-sentinel/shared";

export type ExecutionIntentRecordArgs = {
  intent_id: string;
  asset_id: string;
  report_hash: string;
  decision: "Approve" | "Review" | "Blocked";
  authorization: string;
  principal_cap_usd: number;
  intent_hash: string;
  created_at_ms: number;
};

export const EXECUTION_ENTRY_POINTS = {
  recordExecutionIntent: "record_execution_intent",
  getExecutionIntent: "get_execution_intent"
} as const;

export function toExecutionIntentRecordArgs(
  intent: ExecutionIntent,
  intentHash: string,
  createdAtMs = Date.now()
): ExecutionIntentRecordArgs {
  return {
    intent_id: intent.intentId,
    asset_id: intent.assetId,
    report_hash: intent.reportHash,
    decision:
      intent.decision === "approve" ? "Approve" : intent.decision === "review" ? "Review" : "Blocked",
    authorization: intent.authorization,
    principal_cap_usd: intent.principalCapUsd,
    intent_hash: intentHash,
    created_at_ms: createdAtMs
  };
}
