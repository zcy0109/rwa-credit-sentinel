import type { CasperAttestation, RiskReport } from "@rwa-sentinel/shared";
import type { RiskRegistryCallPreview } from "@rwa-sentinel/casper";

export type RiskCredentialRecord = {
  report: RiskReport;
  attestation: CasperAttestation;
  registryCall: RiskRegistryCallPreview;
  savedAt: string;
};

class CredentialRegistry {
  private readonly records = new Map<string, RiskCredentialRecord>();

  save(record: Omit<RiskCredentialRecord, "savedAt">): RiskCredentialRecord {
    const saved: RiskCredentialRecord = {
      ...record,
      savedAt: new Date().toISOString()
    };

    this.records.set(record.report.assetId, saved);
    return saved;
  }

  get(assetId: string): RiskCredentialRecord | undefined {
    return this.records.get(assetId);
  }

  list(): RiskCredentialRecord[] {
    return Array.from(this.records.values()).sort((a, b) => b.savedAt.localeCompare(a.savedAt));
  }

  clear(): void {
    this.records.clear();
  }
}

export const credentialRegistry = new CredentialRegistry();
