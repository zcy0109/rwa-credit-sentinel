# Casper Agentic Buildathon Finals Submission

## Project

**RWA Credit Sentinel**

RWA Credit Sentinel is a bounded autonomous underwriting and execution prototype for
invoice-backed financing. Eight specialized agents turn public evidence into a verifiable risk
credential, evaluate that credential against deterministic vault policy, cap executable principal,
and anchor both the credential and resulting execution intent on Casper Testnet.

Repository: https://github.com/zcy0109/rwa-credit-sentinel

## Why It Matters

DeFi protocols cannot safely act on an opaque risk score. They need to know what evidence was
used, which policy boundaries passed, who is authorized to act, and whether the decision can be
verified later.

This project creates a two-proof chain:

1. A risk credential binds the asset, score, decision, report hash, and evidence hash.
2. An execution intent binds that credential to nine vault-policy checks, a principal cap, and an
   explicit authorization mode.

Private keys remain outside the agent workflow, and the signed policy is locked on the server
rather than accepted from the caller. Hard failures block execution, soft exceptions route to
reviewer multisig, and only a clean autonomous case receives policy-key authorization.

## Judge Test Path

1. Run `npm install` and `npm run dev`.
2. Open `http://127.0.0.1:5173`.
3. Select **Verify live contract state** and confirm all 13 comparisons pass.
4. Select **Load sample**, inspect the synthetic four-document evidence pack, and run underwriting.
5. Alternatively, use **Add evidence files** with small JSON, CSV, TXT, or PDF files. The server
   recomputes every content hash and explicitly states that claim verification was not performed.
6. Inspect the document hashes, manifest hash, risk factors, evidence hash, agent tools, runtime
   provenance, and private-key boundary.
7. Keep the default autonomous policy and select **Evaluate capital action**.
8. Inspect the nine checks, computed principal cap, authorization, and execution trace.
9. Raise advance rate above `80%` to see reviewer-multisig routing.
10. Clear credential verification to see a `$0` blocked execution.
11. Use **Decision receipt** to export the server-generated, content-hashed audit record.

The UI defaults to a deterministic local proof so judges can safely repeat the workflow without a
private key or Testnet CSPR. The published Testnet transactions below prove the same contract
paths were deployed, written, and read back.

## Casper Testnet Evidence

### Finals contract

- Deployment:
  https://testnet.cspr.live/transaction/3a305efe3c72339e00655a0eace4d5f0ba11514717241204fab6029a458e591c
- Contract hash:
  `6a248275de2c4518a9adb4996d62183e0a10899cd0b9080274cf72504ed9cd4f`
- Package hash:
  `2c34005155776d58709aa092eadb967b60d024a99e2073e131ec500a7e98358f`

### Risk credential write

- Entry point: `record_credential`
- Transaction:
  https://testnet.cspr.live/transaction/da9174726c74f11ae54e47368f933b3e0effc48e1ac376ff0f34a77d632cebd6
- Asset: `invoice:acme-export-invoice-pool-finals`
- Score / decision: `80 / Eligible`
- Evidence manifest:
  `06e0a311d67f64e116fc2f0f134bbfa9b438e8f0e7c733d636080ff8a2a3420d`
- Dictionary key:
  `dictionary-0d1ae99a898ca2cbcee6372256ed77868577ec045e5071998ffb0caa7fc2ad52`

### Execution intent write

- Entry point: `record_execution_intent`
- Transaction:
  https://testnet.cspr.live/transaction/68175104219126eee20876aa7446301888338838bb1430bd1ce01c5ebbe2542a
- Intent: `intent-b781ee81`
- Decision / authorization: `Approve / policy_key`
- Principal cap: `$125,000`
- Policy result: `9 / 9 checks passed`
- Dictionary key:
  `dictionary-eb1679fc5cd63e7b8f27d74990415252d74d36f58ba26ecbb26426d3ea7816db`

## Repeatable Evidence

```bash
npm run casper:read:registry
npm run casper:read:execution -- --intent-id=intent-b781ee81
npm run verify
npm audit --audit-level=high
```

The readback commands query Casper RPC without a private key. The full verification suite builds
every workspace, runs domain/API/Casper tests, exercises the product flow, and checks the
30-case policy benchmark.

The UI's **Verify live contract state** action performs the same public read and compares the
credential dictionary key, asset, decisions, report and evidence hashes, execution authorization,
principal cap, and canonical intent hash. The sample evidence endpoint exposes all four synthetic
documents and their content hashes for inspection.

## Evaluation Evidence

The deterministic benchmark contains 30 labeled cases and covers every policy failure mode:

- risk score floor
- collateral coverage
- advance-rate ceiling
- liquidity buffer
- evidence freshness
- single-asset exposure
- credential verification
- report-hash verification
- covenant breach

The benchmark validates policy behavior; Testnet transactions validate chain integration. It is
not presented as a predictive credit-model accuracy claim.

## Long-Term Launch Plan

The project has a gated 30/90/180-day plan:

- a public Testnet integration pilot and external schema validation
- a controlled shadow-mode trial with policy versioning and multisig review
- an audited, legally approved limited receivables launch

The full milestones, metrics, launch gates, and Casper ecosystem contribution are documented in
`docs/LAUNCH_PLAN.md`. Security assumptions and residual risks are documented in
`docs/THREAT_MODEL.md`.

## Scope

The finals prototype prepares and anchors bounded execution intents. It does not custody assets,
move loan principal, ingest private KYC documents, or claim production financial safety. Those
boundaries are intentional: the product demonstrates accountable agent authorization without
placing funds or secrets inside an LLM-controlled loop.
