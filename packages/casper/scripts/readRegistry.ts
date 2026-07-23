import dotenv from "dotenv";
import { readRiskCredentialState } from "../src/stateReader.js";

dotenv.config({ path: new URL("../../../.env", import.meta.url), quiet: true });
dotenv.config({ quiet: true });

const DEFAULT_TESTNET_RPC = "https://node.testnet.casper.network/rpc";
const DEFAULT_ASSET_ID = "invoice:acme-export-invoice-pool-finals";
const rpcUrl = process.env.CASPER_RPC_URL ?? DEFAULT_TESTNET_RPC;
const contractHash = process.env.CASPER_RISK_REGISTRY_HASH;
const assetId = process.argv.find((arg) => arg.startsWith("--asset-id="))?.split("=")[1] ?? DEFAULT_ASSET_ID;

if (!contractHash) {
  throw new Error("CASPER_RISK_REGISTRY_HASH is required to read the registry.");
}

const result = await readRiskCredentialState({
  rpcUrl,
  contractHash,
  assetId
});

console.log(
  JSON.stringify(
    {
      assetId,
      contractHash: result.contractHash,
      recordsUref: result.seedUref,
      dictionaryKey: result.dictionaryKey,
      stateRootHash: result.stateRootHash,
      credential: result.record
    },
    null,
    2
  )
);
