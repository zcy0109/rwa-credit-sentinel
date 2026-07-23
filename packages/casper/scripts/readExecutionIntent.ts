import dotenv from "dotenv";

dotenv.config({ path: new URL("../../../.env", import.meta.url), quiet: true });
dotenv.config({ quiet: true });

const DEFAULT_TESTNET_RPC = "https://node.testnet.casper.network/rpc";
const EXECUTION_INTENTS_NAMED_KEY = "execution_intents";

const rpcUrl = process.env.CASPER_RPC_URL ?? DEFAULT_TESTNET_RPC;
const contractHash = process.env.CASPER_RISK_REGISTRY_HASH;
const intentId = process.argv.find((arg) => arg.startsWith("--intent-id="))?.split("=")[1];

if (!contractHash) {
  throw new Error("CASPER_RISK_REGISTRY_HASH is required to read execution intents.");
}
if (!intentId) {
  throw new Error("Pass the execution intent as --intent-id=intent-xxxxxxxx.");
}

const contract = await rpc("query_global_state", {
  key: `hash-${normalizeHash(contractHash)}`,
  path: []
});
const intentsUref = findNamedKey(contract, EXECUTION_INTENTS_NAMED_KEY);
const stateRoot = await rpc("chain_get_state_root_hash", {});
const storedIntent = await rpc("state_get_dictionary_item", {
  state_root_hash: stateRoot.result.state_root_hash,
  dictionary_identifier: {
    URef: {
      seed_uref: intentsUref,
      dictionary_item_key: intentId
    }
  }
});

console.log(
  JSON.stringify(
    {
      intentId,
      contractHash: normalizeHash(contractHash),
      intentsUref,
      dictionaryKey: storedIntent.result.dictionary_key,
      executionIntent: JSON.parse(storedIntent.result.stored_value.CLValue.parsed)
    },
    null,
    2
  )
);

async function rpc(method: string, params: unknown): Promise<any> {
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params })
  });
  const payload = await response.json();
  if (payload.error) {
    throw new Error(`${method} failed: ${payload.error.message}`);
  }
  return payload;
}

function findNamedKey(contract: any, name: string): string {
  const namedKeys = contract.result?.stored_value?.Contract?.named_keys;
  if (!Array.isArray(namedKeys)) {
    throw new Error("Unable to read contract named keys from Casper RPC response.");
  }
  const namedKey = namedKeys.find((item) => item?.name === name);
  if (typeof namedKey?.key !== "string") {
    throw new Error(`Contract named key '${name}' was not found.`);
  }
  return namedKey.key;
}

function normalizeHash(value: string): string {
  return value.replace(/^hash-/, "").replace(/^contract-/, "");
}
