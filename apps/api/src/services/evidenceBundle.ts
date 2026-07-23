import {
  SAMPLE_EVIDENCE_BUNDLE_ID,
  type EvidenceDocumentDescriptor,
  type EvidenceManifest
} from "@rwa-sentinel/shared";
import { sha256Bytes, sha256Hex } from "./hash.js";

export type EvidenceDocument = {
  id: string;
  title: string;
  type: EvidenceDocumentDescriptor["type"];
  content: Record<string, unknown>;
};

export type EvidenceBundle = {
  manifest: EvidenceManifest;
  documents: EvidenceDocument[];
};

export type UploadedEvidenceFile = {
  name: string;
  mediaType: "application/json" | "text/csv" | "text/plain" | "application/pdf";
  evidenceType: EvidenceDocumentDescriptor["type"];
  contentBase64: string;
};

export type EvidenceExtractionSummary = {
  documentId: string;
  format: string;
  recordCount?: number;
  fieldNames?: string[];
};

export type UploadedEvidenceBundle = {
  manifest: EvidenceManifest;
  extraction: EvidenceExtractionSummary[];
  integrityStatement: string;
  claimVerification: "not-performed";
};

const MAX_FILE_BYTES = 1_000_000;
const MAX_TOTAL_BYTES = 4_000_000;
const uploadedManifests = new Map<string, EvidenceManifest>();

const sampleDocuments: EvidenceDocument[] = [
  {
    id: "invoice-register-2026-06",
    title: "Invoice register",
    type: "invoice_register",
    content: {
      synthetic: true,
      seller: "Acme Export LLC",
      buyer: "Acme Manufacturing",
      currency: "USD",
      invoices: [
        { invoiceNumber: "AE-260601", amount: 42000, dueDate: "2026-08-01" },
        { invoiceNumber: "AE-260607", amount: 39500, dueDate: "2026-08-07" },
        { invoiceNumber: "AE-260615", amount: 43500, dueDate: "2026-08-15" }
      ],
      totalAmount: 125000
    }
  },
  {
    id: "purchase-order-register",
    title: "Purchase-order references",
    type: "purchase_order",
    content: {
      synthetic: true,
      buyer: "Acme Manufacturing",
      orders: [
        { purchaseOrder: "PO-88301", invoiceNumber: "AE-260601", status: "approved" },
        { purchaseOrder: "PO-88318", invoiceNumber: "AE-260607", status: "approved" },
        { purchaseOrder: "PO-88344", invoiceNumber: "AE-260615", status: "approved" }
      ]
    }
  },
  {
    id: "delivery-confirmations",
    title: "Delivery confirmations",
    type: "delivery_confirmation",
    content: {
      synthetic: true,
      confirmations: [
        { purchaseOrder: "PO-88301", deliveredAt: "2026-06-04", accepted: true },
        { purchaseOrder: "PO-88318", deliveredAt: "2026-06-11", accepted: true },
        { purchaseOrder: "PO-88344", deliveredAt: "2026-06-18", accepted: true }
      ],
      unresolvedExceptions: 0
    }
  },
  {
    id: "buyer-payment-history",
    title: "Buyer payment history",
    type: "payment_history",
    content: {
      synthetic: true,
      observationMonths: 12,
      invoicesPaid: 31,
      onTimePayments: 29,
      averageDaysLate: 1.8,
      defaults: 0
    }
  }
];

export async function getSampleEvidenceBundle(
  documents: EvidenceDocument[] = sampleDocuments
): Promise<EvidenceBundle> {
  const descriptors = await Promise.all(
    documents.map(async (document) => ({
      id: document.id,
      title: document.title,
      type: document.type,
      sha256: await sha256Hex(document.content)
    }))
  );
  const unsignedManifest = {
    schemaVersion: "rwa-evidence-manifest/v1" as const,
    bundleId: SAMPLE_EVIDENCE_BUNDLE_ID,
    synthetic: true,
    label: "Synthetic Acme export invoice evidence pack",
    documentCount: descriptors.length,
    documents: descriptors
  };

  return {
    manifest: {
      ...unsignedManifest,
      manifestHash: await sha256Hex(unsignedManifest)
    },
    documents
  };
}

export async function resolveEvidenceManifest(
  bundleId: string | undefined
): Promise<EvidenceManifest | undefined> {
  if (!bundleId) {
    return undefined;
  }
  if (bundleId === SAMPLE_EVIDENCE_BUNDLE_ID) {
    return (await getSampleEvidenceBundle()).manifest;
  }

  const uploaded = uploadedManifests.get(bundleId);
  if (!uploaded) {
    throw new Error("Evidence bundle was not found. Upload the files again.");
  }
  return uploaded;
}

export async function createUploadedEvidenceBundle(
  label: string,
  files: UploadedEvidenceFile[]
): Promise<UploadedEvidenceBundle> {
  const decoded = files.map((file) => {
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(file.contentBase64)) {
      throw new Error(`Evidence file ${file.name} is not valid base64.`);
    }

    const bytes = Buffer.from(file.contentBase64, "base64");
    if (bytes.byteLength === 0 || bytes.byteLength > MAX_FILE_BYTES) {
      throw new Error(`Evidence file ${file.name} must be between 1 byte and 1 MB.`);
    }
    return { file, bytes };
  });

  const totalBytes = decoded.reduce((sum, item) => sum + item.bytes.byteLength, 0);
  if (totalBytes > MAX_TOTAL_BYTES) {
    throw new Error("The combined evidence package must not exceed 4 MB.");
  }

  const descriptors = await Promise.all(
    decoded.map(async ({ file, bytes }, index) => ({
      id: `${slug(file.name)}-${index + 1}`,
      title: file.name,
      type: file.evidenceType,
      sha256: await sha256Bytes(bytes),
      mediaType: file.mediaType,
      sizeBytes: bytes.byteLength
    }))
  );
  const contentSetHash = await sha256Hex(
    descriptors.map(({ sha256, type, sizeBytes }) => ({ sha256, type, sizeBytes }))
  );
  const bundleId = `evidence-${contentSetHash.slice(0, 16)}`;
  const unsignedManifest = {
    schemaVersion: "rwa-evidence-manifest/v1" as const,
    bundleId,
    synthetic: false,
    label,
    documentCount: descriptors.length,
    documents: descriptors
  };
  const manifest = {
    ...unsignedManifest,
    manifestHash: await sha256Hex(unsignedManifest)
  };

  uploadedManifests.set(bundleId, manifest);

  return {
    manifest,
    extraction: decoded.map(({ file, bytes }, index) => {
      const descriptor = descriptors[index];
      if (!descriptor) {
        throw new Error("Evidence descriptor generation failed.");
      }
      return summarizeEvidence(descriptor.id, file.mediaType, bytes);
    }),
    integrityStatement:
      "The server recomputed every SHA-256 digest. This proves content integrity, not the truth of the underlying commercial claims.",
    claimVerification: "not-performed"
  };
}

export function clearUploadedEvidenceBundles(): void {
  uploadedManifests.clear();
}

function summarizeEvidence(
  documentId: string,
  mediaType: UploadedEvidenceFile["mediaType"],
  bytes: Buffer
): EvidenceExtractionSummary {
  if (mediaType === "application/pdf") {
    return { documentId, format: "PDF (hash only)" };
  }

  const text = bytes.toString("utf8");
  if (mediaType === "application/json") {
    try {
      const value = JSON.parse(text) as unknown;
      const firstRecord = Array.isArray(value) ? value[0] : value;
      return {
        documentId,
        format: "JSON",
        recordCount: Array.isArray(value) ? value.length : 1,
        fieldNames:
          firstRecord && typeof firstRecord === "object"
            ? Object.keys(firstRecord as Record<string, unknown>).slice(0, 12)
            : []
      };
    } catch {
      return { documentId, format: "JSON (unparsed)" };
    }
  }

  if (mediaType === "text/csv") {
    const rows = text.split(/\r?\n/).filter(Boolean);
    return {
      documentId,
      format: "CSV",
      recordCount: Math.max(0, rows.length - 1),
      fieldNames: rows[0]?.split(",").map((field) => field.trim()).slice(0, 12) ?? []
    };
  }

  return {
    documentId,
    format: "Text",
    recordCount: text.split(/\r?\n/).filter(Boolean).length
  };
}

function slug(value: string): string {
  const normalized = value
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return normalized || "evidence";
}
