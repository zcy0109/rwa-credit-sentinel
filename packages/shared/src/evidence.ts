export const SAMPLE_EVIDENCE_BUNDLE_ID = "acme-export-invoice-pool-v1";

export type EvidenceDocumentDescriptor = {
  id: string;
  title: string;
  type:
    | "invoice_register"
    | "purchase_order"
    | "delivery_confirmation"
    | "payment_history"
    | "other";
  sha256: string;
  mediaType?: string;
  sizeBytes?: number;
};

export type EvidenceManifest = {
  schemaVersion: "rwa-evidence-manifest/v1";
  bundleId: string;
  synthetic: boolean;
  label: string;
  documentCount: number;
  documents: EvidenceDocumentDescriptor[];
  manifestHash: string;
};
