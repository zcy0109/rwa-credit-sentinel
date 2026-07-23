import dotenv from "dotenv";
import { finalsEvidence } from "@rwa-sentinel/shared";
import { createCasperAdapterFromEnv, readCasperConfig } from "../src/index.js";

dotenv.config({ path: new URL("../../../.env", import.meta.url), quiet: true });
dotenv.config({ quiet: true });

const adapter = createCasperAdapterFromEnv();
const config = readCasperConfig(process.env);
const attestation = await adapter.attestRiskCredential({
  assetId: finalsEvidence.assetId,
  riskScore: 80,
  decision: "eligible",
  reportHash: finalsEvidence.reportHash,
  evidenceHash: finalsEvidence.evidenceHash,
  createdAtMs: Date.now()
});

console.log(
  JSON.stringify(
    {
      mode: config.mode,
      credential: {
        assetId: finalsEvidence.assetId,
        riskScore: 80,
        decision: finalsEvidence.expectedRiskDecision,
        reportHash: finalsEvidence.reportHash,
        evidenceHash: finalsEvidence.evidenceHash
      },
      attestation
    },
    null,
    2
  )
);
