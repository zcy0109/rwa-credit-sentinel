import dotenv from "dotenv";
import { createCasperAdapterFromEnv, readCasperConfig } from "../src/index.js";

dotenv.config({ path: new URL("../../../.env", import.meta.url), quiet: true });
dotenv.config({ quiet: true });

const modeArg = process.argv.find((arg) => arg.startsWith("--mode="))?.split("=")[1];
if (modeArg === "mock" || modeArg === "real") {
  process.env.CASPER_MODE = modeArg;
}

const adapter = createCasperAdapterFromEnv();
const config = readCasperConfig(process.env);

const result = await adapter.attestRiskCredential({
  assetId: "invoice:demo-acme-batch",
  riskScore: 78,
  decision: "eligible",
  reportHash: "9fd81df9ea02d7448837e020ba84ebc45904cf52adeefe628cb31f5aa8f65d0ed",
  evidenceHash: "4df81df9ea02d7448837e020ba84ebc45904cf52adeefe628cb31f5aa8f65d0aa"
});

console.log(JSON.stringify({ mode: config.mode, result }, null, 2));
