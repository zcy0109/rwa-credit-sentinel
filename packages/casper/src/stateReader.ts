export type CasperRiskCredentialRecord = {
  asset_id: string;
  risk_score: number;
  decision: string;
  report_hash: string;
  evidence_hash: string;
  issuer: string;
  created_at_ms: number;
};

export type CasperExecutionIntentRecord = {
  intent_id: string;
  asset_id: string;
  report_hash: string;
  decision: string;
  authorization: string;
  principal_cap_usd: number;
  intent_hash: string;
  issuer: string;
  created_at_ms: number;
};

export type CasperDictionaryRead<TRecord> = {
  contractHash: string;
  namedKey: string;
  seedUref: string;
  dictionaryKey: string;
  stateRootHash: string;
  record: TRecord;
  readAt: string;
};

export type CasperStateReaderOptions = {
  rpcUrl: string;
  contractHash: string;
  fetchFn?: typeof fetch;
};

export async function readRiskCredentialState(
  options: CasperStateReaderOptions & { assetId: string }
): Promise<CasperDictionaryRead<CasperRiskCredentialRecord>> {
  return readDictionaryRecord(options, "records", options.assetId);
}

export async function readExecutionIntentState(
  options: CasperStateReaderOptions & { intentId: string }
): Promise<CasperDictionaryRead<CasperExecutionIntentRecord>> {
  return readDictionaryRecord(options, "execution_intents", options.intentId);
}

async function readDictionaryRecord<TRecord>(
  options: CasperStateReaderOptions,
  namedKey: string,
  dictionaryItemKey: string
): Promise<CasperDictionaryRead<TRecord>> {
  const fetchFn = options.fetchFn ?? fetch;
  const contractHash = normalizeContractHash(options.contractHash);
  const contract = await rpc(fetchFn, options.rpcUrl, "query_global_state", {
    key: `hash-${contractHash}`,
    path: []
  });
  const seedUref = findNamedKey(contract, namedKey);
  const stateRoot = await rpc(fetchFn, options.rpcUrl, "chain_get_state_root_hash", {});
  const stateRootHash = readString(stateRoot, ["result", "state_root_hash"]);
  const dictionary = await rpc(fetchFn, options.rpcUrl, "state_get_dictionary_item", {
    state_root_hash: stateRootHash,
    dictionary_identifier: {
      URef: {
        seed_uref: seedUref,
        dictionary_item_key: dictionaryItemKey
      }
    }
  });
  const dictionaryKey = readString(dictionary, ["result", "dictionary_key"]);
  const parsed = readUnknown(dictionary, ["result", "stored_value", "CLValue", "parsed"]);
  const record = parseStoredRecord<TRecord>(parsed);

  return {
    contractHash,
    namedKey,
    seedUref,
    dictionaryKey,
    stateRootHash,
    record,
    readAt: new Date().toISOString()
  };
}

async function rpc(
  fetchFn: typeof fetch,
  rpcUrl: string,
  method: string,
  params: unknown
): Promise<unknown> {
  const response = await fetchFn(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params })
  });

  if (!response.ok) {
    throw new Error(`${method} failed with HTTP ${response.status}.`);
  }

  const payload = (await response.json()) as { error?: { message?: string } };
  if (payload.error) {
    throw new Error(`${method} failed: ${payload.error.message ?? "Unknown Casper RPC error"}`);
  }

  return payload;
}

function findNamedKey(payload: unknown, name: string): string {
  const namedKeys = readUnknown(payload, ["result", "stored_value", "Contract", "named_keys"]);
  if (!Array.isArray(namedKeys)) {
    throw new Error("Unable to read contract named keys from Casper RPC response.");
  }

  const match = namedKeys.find(
    (item) =>
      typeof item === "object" &&
      item !== null &&
      "name" in item &&
      (item as { name: unknown }).name === name
  ) as { key?: unknown } | undefined;

  if (typeof match?.key !== "string") {
    throw new Error(`Contract named key '${name}' was not found.`);
  }

  return match.key;
}

function parseStoredRecord<TRecord>(value: unknown): TRecord {
  if (typeof value === "string") {
    return JSON.parse(value) as TRecord;
  }

  if (typeof value === "object" && value !== null) {
    return value as TRecord;
  }

  throw new Error("Casper dictionary item does not contain a readable record.");
}

function readString(payload: unknown, path: string[]): string {
  const value = readUnknown(payload, path);
  if (typeof value !== "string") {
    throw new Error(`Casper RPC response is missing ${path.join(".")}.`);
  }
  return value;
}

function readUnknown(payload: unknown, path: string[]): unknown {
  let value = payload;
  for (const key of path) {
    if (typeof value !== "object" || value === null || !(key in value)) {
      return undefined;
    }
    value = (value as Record<string, unknown>)[key];
  }
  return value;
}

function normalizeContractHash(value: string): string {
  return value.replace(/^hash-/, "").replace(/^contract-/, "");
}
