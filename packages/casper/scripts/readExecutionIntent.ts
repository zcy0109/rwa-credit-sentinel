import dotenv from "dotenv";
import { readExecutionIntentState } from "../src/stateReader.js";

dotenv.config({ path: new URL("../../../.env", import.meta.url), quiet: true });
dotenv.config({ quiet: true });

const DEFAULT_TESTNET_RPC = "https://node.testnet.casper.network/rpc";
const rpcUrl = process.env.CASPER_RPC_URL ?? DEFAULT_TESTNET_RPC;
const contractHash = process.env.CASPER_RISK_REGISTRY_HASH;
const intentId = process.argv.find((arg) => arg.startsWith("--intent-id="))?.split("=")[1];

if (!contractHash) {
  throw new Error("CASPER_RISK_REGISTRY_HASH is required to read execution intents.");
}
if (!intentId) {
  throw new Error("Pass the execution intent as --intent-id=intent-xxxxxxxx.");
}

const result = await readExecutionIntentState({
  rpcUrl,
  contractHash,
  intentId
});

console.log(
  JSON.stringify(
    {
      intentId,
      contractHash: result.contractHash,
      intentsUref: result.seedUref,
      dictionaryKey: result.dictionaryKey,
      stateRootHash: result.stateRootHash,
      executionIntent: result.record
    },
    null,
    2
  )
);
