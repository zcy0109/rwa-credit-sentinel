import cors from "cors";
import express from "express";
import { z } from "zod";
import { buildRiskRegistryCallPreview, createCasperAdapterFromEnv } from "@rwa-sentinel/casper";
import { buildRiskReport } from "./services/riskEngine.js";
import { credentialRegistry } from "./services/credentialRegistry.js";

const financingRequestSchema = z.object({
  assetName: z.string().min(2),
  assetType: z.enum(["invoice", "trade_receivable", "real_estate", "commodity", "other"]),
  requestedAmountUsd: z.number().positive(),
  maturityDays: z.number().int().positive(),
  debtorName: z.string().min(2),
  debtorCountry: z.string().min(2),
  description: z.string().min(10),
  publicEvidenceUrls: z.array(z.string().url()).default([])
});

export function createApp() {
  const app = express();
  const casper = createCasperAdapterFromEnv();

  app.use(cors());
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "rwa-credit-sentinel-api" });
  });

  app.get("/api/credentials", (_req, res) => {
    res.json({ credentials: credentialRegistry.list() });
  });

  app.get("/api/credentials/:assetId", (req, res) => {
    const credential = credentialRegistry.get(req.params.assetId);

    if (!credential) {
      res.status(404).json({ error: "Credential not found" });
      return;
    }

    res.json(credential);
  });

  app.post("/api/reports", async (req, res, next) => {
    try {
      const request = financingRequestSchema.parse(req.body);
      const report = await buildRiskReport(request);
      const attestationInput = {
        assetId: report.assetId,
        riskScore: report.riskScore,
        decision: report.decision,
        reportHash: report.reportHash,
        evidenceHash: report.evidenceHash,
        createdAtMs: Date.now()
      };
      const attestation = await casper.attestRiskCredential(attestationInput);
      const registryCall = buildRiskRegistryCallPreview(attestationInput, process.env.CASPER_RISK_REGISTRY_HASH);
      const credential = credentialRegistry.save({ report, attestation, registryCall });

      res.json(credential);
    } catch (error) {
      next(error);
    }
  });

  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid financing request", issues: error.issues });
      return;
    }

    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  });

  return app;
}
