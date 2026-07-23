import { beforeEach, describe, expect, it } from "vitest";
import {
  clearUploadedEvidenceBundles,
  createUploadedEvidenceBundle,
  getSampleEvidenceBundle,
  resolveEvidenceManifest,
  type EvidenceDocument
} from "../src/services/evidenceBundle.js";

describe("evidence bundle", () => {
  beforeEach(() => {
    clearUploadedEvidenceBundles();
  });

  it("creates stable content and manifest hashes", async () => {
    const first = await getSampleEvidenceBundle();
    const second = await getSampleEvidenceBundle();

    expect(first.manifest.synthetic).toBe(true);
    expect(first.manifest.documentCount).toBe(4);
    expect(first.manifest.manifestHash).toMatch(/^[a-f0-9]{64}$/);
    expect(first.manifest).toEqual(second.manifest);
    expect(first.manifest.documents.every((document) => /^[a-f0-9]{64}$/.test(document.sha256))).toBe(true);
  });

  it("changes both document and manifest hashes when evidence content changes", async () => {
    const original = await getSampleEvidenceBundle();
    const changedDocuments: EvidenceDocument[] = original.documents.map((document) => ({
      ...document,
      content: { ...document.content }
    }));
    changedDocuments[0].content.totalAmount = 999999;

    const changed = await getSampleEvidenceBundle(changedDocuments);
    expect(changed.manifest.documents[0].sha256).not.toBe(original.manifest.documents[0].sha256);
    expect(changed.manifest.manifestHash).not.toBe(original.manifest.manifestHash);
  });

  it("hashes uploaded bytes and exposes only integrity-safe extraction metadata", async () => {
    const content = JSON.stringify([
      { invoiceNumber: "INV-001", amount: 125000, dueDate: "2026-08-30" }
    ]);
    const uploaded = await createUploadedEvidenceBundle("Pilot invoice evidence", [
      {
        name: "invoice-register.json",
        mediaType: "application/json",
        evidenceType: "invoice_register",
        contentBase64: Buffer.from(content).toString("base64")
      }
    ]);

    expect(uploaded.manifest.synthetic).toBe(false);
    expect(uploaded.manifest.documents[0]?.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(uploaded.extraction[0]).toMatchObject({
      format: "JSON",
      recordCount: 1,
      fieldNames: ["invoiceNumber", "amount", "dueDate"]
    });
    expect(uploaded.claimVerification).toBe("not-performed");
    expect(await resolveEvidenceManifest(uploaded.manifest.bundleId)).toEqual(uploaded.manifest);
  });

  it("rejects uploaded evidence above the per-file size boundary", async () => {
    await expect(
      createUploadedEvidenceBundle("Oversized evidence", [
        {
          name: "oversized.txt",
          mediaType: "text/plain",
          evidenceType: "other",
          contentBase64: Buffer.alloc(1_000_001, "a").toString("base64")
        }
      ])
    ).rejects.toThrow("1 MB");
  });
});
