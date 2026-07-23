import { describe, expect, it, vi } from "vitest";
import {
  readExecutionIntentState,
  readRiskCredentialState
} from "../src/stateReader.js";

describe("Casper state reader", () => {
  it("resolves and parses a risk credential dictionary record", async () => {
    const fetchFn = rpcSequence([
      contractResponse("records", "uref-records-007"),
      stateRootResponse("root-01"),
      dictionaryResponse(
        "dictionary-risk",
        JSON.stringify({
          asset_id: "invoice:demo",
          risk_score: 78,
          decision: "Eligible",
          report_hash: "report",
          evidence_hash: "evidence",
          issuer: "AccountHash(issuer)",
          created_at_ms: 100
        })
      )
    ]);

    const result = await readRiskCredentialState({
      rpcUrl: "https://rpc.example",
      contractHash: "hash-contract",
      assetId: "invoice:demo",
      fetchFn
    });

    expect(result).toMatchObject({
      contractHash: "contract",
      seedUref: "uref-records-007",
      dictionaryKey: "dictionary-risk",
      stateRootHash: "root-01",
      record: {
        asset_id: "invoice:demo",
        risk_score: 78,
        decision: "Eligible"
      }
    });
    expect(fetchFn).toHaveBeenCalledTimes(3);
  });

  it("resolves and parses an execution-intent dictionary record", async () => {
    const fetchFn = rpcSequence([
      contractResponse("execution_intents", "uref-intents-007"),
      stateRootResponse("root-02"),
      dictionaryResponse("dictionary-intent", {
        intent_id: "intent-01",
        asset_id: "invoice:demo",
        report_hash: "report",
        decision: "Approve",
        authorization: "policy_key",
        principal_cap_usd: 125000,
        intent_hash: "intent-hash",
        issuer: "AccountHash(issuer)",
        created_at_ms: 200
      })
    ]);

    const result = await readExecutionIntentState({
      rpcUrl: "https://rpc.example",
      contractHash: "contract-contract",
      intentId: "intent-01",
      fetchFn
    });

    expect(result.record).toMatchObject({
      intent_id: "intent-01",
      authorization: "policy_key",
      principal_cap_usd: 125000
    });
    expect(result.dictionaryKey).toBe("dictionary-intent");
  });
});

function rpcSequence(payloads: unknown[]) {
  return vi.fn<typeof fetch>().mockImplementation(async () => {
    const payload = payloads.shift();
    return {
      ok: true,
      status: 200,
      json: async () => payload
    } as Response;
  });
}

function contractResponse(name: string, key: string) {
  return {
    result: {
      stored_value: {
        Contract: {
          named_keys: [{ name, key }]
        }
      }
    }
  };
}

function stateRootResponse(stateRootHash: string) {
  return { result: { state_root_hash: stateRootHash } };
}

function dictionaryResponse(dictionaryKey: string, parsed: unknown) {
  return {
    result: {
      dictionary_key: dictionaryKey,
      stored_value: {
        CLValue: { parsed }
      }
    }
  };
}
