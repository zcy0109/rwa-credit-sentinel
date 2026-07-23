import type { ExecutionIntentAttestation } from "@rwa-sentinel/casper";
import type { CasperAttestation, ExecutionEvaluation } from "@rwa-sentinel/shared";

export type ExecutionIntentRecord = {
  evaluation: ExecutionEvaluation;
  credential: CasperAttestation;
  evaluatedAt: string;
  intentHash?: string;
  attestation?: ExecutionIntentAttestation;
  anchoredAt?: string;
};

class ExecutionRegistry {
  private readonly records = new Map<string, ExecutionIntentRecord>();

  saveEvaluation(
    evaluation: ExecutionEvaluation,
    credential: CasperAttestation
  ): ExecutionIntentRecord {
    const record: ExecutionIntentRecord = {
      evaluation,
      credential,
      evaluatedAt: new Date().toISOString()
    };

    this.records.set(evaluation.intent.intentId, record);
    return record;
  }

  saveAttestation(
    intentId: string,
    intentHash: string,
    attestation: ExecutionIntentAttestation
  ): ExecutionIntentRecord {
    const current = this.records.get(intentId);
    if (!current) {
      throw new Error(`Execution intent ${intentId} is not registered.`);
    }

    const anchored: ExecutionIntentRecord = {
      ...current,
      intentHash,
      attestation,
      anchoredAt: new Date().toISOString()
    };
    this.records.set(intentId, anchored);
    return anchored;
  }

  get(intentId: string): ExecutionIntentRecord | undefined {
    return this.records.get(intentId);
  }

  list(): ExecutionIntentRecord[] {
    return Array.from(this.records.values()).sort((a, b) =>
      b.evaluatedAt.localeCompare(a.evaluatedAt)
    );
  }

  clear(): void {
    this.records.clear();
  }
}

export const executionRegistry = new ExecutionRegistry();
