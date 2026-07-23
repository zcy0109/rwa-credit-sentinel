import cors from "cors";
import express from "express";
import { z } from "zod";
import {
  buildRiskRegistryCallPreview,
  createCasperAdapterFromEnv,
  createExecutionIntentAdapterFromEnv
} from "@rwa-sentinel/casper";
import {
  defaultVaultPolicy,
  evaluateExecution,
  runExecutionBenchmark,
  type ExecutionContext
} from "@rwa-sentinel/shared";
import { buildRiskReport } from "./services/riskEngine.js";
import { credentialRegistry } from "./services/credentialRegistry.js";
import { executionRegistry } from "./services/executionRegistry.js";
import { sha256Hex } from "./services/hash.js";
import { buildDecisionReceipt } from "./services/decisionReceipt.js";
import {
  verifyFinalsState,
  type FinalsStateVerification
} from "./services/finalsVerification.js";
import {
  createUploadedEvidenceBundle,
  getSampleEvidenceBundle,
  resolveEvidenceManifest,
  type UploadedEvidenceFile
} from "./services/evidenceBundle.js";

const financingRequestSchema = z.object({
  assetName: z.string().min(2),
  assetType: z.enum(["invoice", "trade_receivable", "real_estate", "commodity", "other"]),
  requestedAmountUsd: z.number().positive(),
  maturityDays: z.number().int().positive(),
  debtorName: z.string().min(2),
  debtorCountry: z.string().min(2),
  description: z.string().min(10),
  publicEvidenceUrls: z.array(z.string().url()).default([]),
  evidenceBundleId: z.string().min(4).max(80).optional()
});

const evidenceTypeSchema = z.enum([
  "invoice_register",
  "purchase_order",
  "delivery_confirmation",
  "payment_history",
  "other"
]);

const evidenceIntakeSchema = z.object({
  label: z.string().min(2).max(120),
  files: z.array(
    z.object({
      name: z.string().min(1).max(120),
      mediaType: z.enum(["application/json", "text/csv", "text/plain", "application/pdf"]),
      evidenceType: evidenceTypeSchema,
      contentBase64: z.string().min(1).max(1_400_000)
    })
  ).min(1).max(6)
});

const executionContextSchema = z.object({
  mode: z.enum(["autonomous", "human_in_loop", "simulation"]),
  collateralRatio: z.number().positive(),
  proposedAdvanceRatePercent: z.number().min(0).max(100),
  liquidityBufferPercent: z.number().min(0).max(100),
  evidenceFreshness: z.number().min(0).max(100),
  credentialVerified: z.boolean(),
  reportHashVerified: z.boolean(),
  covenantBreach: z.boolean()
});

const executionRequestSchema = z.object({
  assetId: z.string().min(2),
  context: executionContextSchema
});

const anchorRequestSchema = z.object({
  intentId: z.string().min(2)
});

export type AppDependencies = {
  verifyFinalsState?: () => Promise<FinalsStateVerification>;
};

export function createApp(dependencies: AppDependencies = {}) {
  const app = express();
  const casper = createCasperAdapterFromEnv();
  const executionAdapter = createExecutionIntentAdapterFromEnv();
  const verifyPublishedFinalsState = dependencies.verifyFinalsState ?? verifyFinalsState;

  app.use(cors());
  app.use(express.json({ limit: "6mb" }));

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

  app.get("/api/execution/benchmark", (_req, res) => {
    res.json(runExecutionBenchmark());
  });

  app.get("/api/evidence/sample", async (_req, res, next) => {
    try {
      res.json(await getSampleEvidenceBundle());
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/evidence/intake", async (req, res, next) => {
    try {
      const input = evidenceIntakeSchema.parse(req.body);
      res.json(
        await createUploadedEvidenceBundle(
          input.label,
          input.files as UploadedEvidenceFile[]
        )
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(error);
        return;
      }
      res.status(400).json({
        error: error instanceof Error ? error.message : "Evidence intake failed"
      });
    }
  });

  app.get("/api/casper/verify-finals", async (_req, res, next) => {
    try {
      res.json(await verifyPublishedFinalsState());
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/execution/intents", (_req, res) => {
    res.json({ intents: executionRegistry.list() });
  });

  app.get("/api/execution/intents/:intentId", (req, res) => {
    const record = executionRegistry.get(req.params.intentId);
    if (!record) {
      res.status(404).json({ error: "Execution intent not found" });
      return;
    }

    res.json(record);
  });

  app.get("/api/execution/receipts/:intentId", async (req, res, next) => {
    try {
      const execution = executionRegistry.get(req.params.intentId);
      if (!execution) {
        res.status(404).json({ error: "Execution intent not found." });
        return;
      }

      const credential = credentialRegistry.get(execution.evaluation.intent.assetId);
      if (!credential) {
        res.status(404).json({ error: "Risk credential not found." });
        return;
      }

      if (req.query.download === "1") {
        res.attachment(`rwa-decision-receipt-${execution.evaluation.intent.intentId}.json`);
      }
      res.json(await buildDecisionReceipt(credential, execution));
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/execution/evaluate", (req, res) => {
    const input = executionRequestSchema.parse(req.body);
    const credential = credentialRegistry.get(input.assetId);

    if (!credential) {
      res.status(404).json({ error: "Credential not found. Run underwriting first." });
      return;
    }

    const context: ExecutionContext = input.context;
    const evaluation = evaluateExecution(credential.report, context, defaultVaultPolicy);
    res.json(executionRegistry.saveEvaluation(evaluation, credential.attestation));
  });

  app.post("/api/execution/anchor", async (req, res, next) => {
    try {
      const input = anchorRequestSchema.parse(req.body);
      const record = executionRegistry.get(input.intentId);
      if (!record) {
        res.status(404).json({ error: "Execution intent not found. Evaluate the request first." });
        return;
      }

      if (record.attestation && record.intentHash) {
        res.json({ ...record, idempotent: true });
        return;
      }

      const intentHash = await sha256Hex(record.evaluation.intent);
      const attestation = await executionAdapter.anchorExecutionIntent(
        record.evaluation.intent,
        intentHash
      );
      res.json({
        ...executionRegistry.saveAttestation(input.intentId, intentHash, attestation),
        idempotent: false
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/reports", async (req, res, next) => {
    try {
      const request = financingRequestSchema.parse(req.body);
      const evidenceManifest = await resolveEvidenceManifest(request.evidenceBundleId);
      const report = await buildRiskReport(request, evidenceManifest);
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
