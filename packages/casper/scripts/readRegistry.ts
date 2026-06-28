import dotenv from "dotenv";

dotenv.config({ path: new URL("../../../.env", import.meta.url), quiet: true });
dotenv.config({ quiet: true });

const DEFAULT_TESTNET_RPC = "https://node.testnet.casper.network/rpc";
const DEFAULT_ASSET_ID = "invoice:demo-acme-batch";
const RECORDS_NAMED_KEY = "records";

const rpcUrl = process.env.CASPER_RPC_URL ?? DEFAULT_TESTNET_RPC;
const contractHash = process.env.CASPER_RISK_REGISTRY_HASH;
const assetId = process.argv.find((arg) => arg.startsWith("--asset-id="))?.split("=")[1] ?? DEFAULT_ASSET_ID;

if (!contractHash) {
  throw new Error("CASPER_RISK_REGISTRY_HASH is required to read the registry.");
}

const contract = await rpc("query_global_state", {
  key: `hash-${normalizeHash(contractHash)}`,
  path: []
});
const recordsUref = findNamedKey(contract, RECORDS_NAMED_KEY);
const stateRoot = await rpc("chain_get_state_root_hash", {});
const credential = await rpc("state_get_dictionary_item", {
  state_root_hash: stateRoot.result.state_root_hash,
  dictionary_identifier: {
    URef: {
      seed_uref: recordsUref,
      dictionary_item_key: assetId
    }
  }
});

console.log(
  JSON.stringify(
    {
      assetId,
      contractHash: normalizeHash(contractHash),
      recordsUref,
      dictionaryKey: credential.result.dictionary_key,
      credential: JSON.parse(credential.result.stored_value.CLValue.parsed)
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
