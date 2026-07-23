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
3. Select **Load sample**, then **Run underwriting agents**.
4. Inspect the risk score, factor explanation, evidence hash, and agent trace.
5. Keep the default autonomous policy and select **Evaluate capital action**.
6. Inspect the nine checks, computed principal cap, authorization, and execution trace.
7. Change collateral coverage below `1.15x` to see a reviewer-multisig decision.
8. Clear credential verification to see execution blocked.
9. Use **Download audit bundle** to export the complete decision record.

The UI defaults to a deterministic local proof so judges can safely repeat the workflow without a
private key or Testnet CSPR. The published Testnet transactions below prove the same contract
paths were deployed, written, and read back.

## Casper Testnet Evidence

### Finals contract

- Deployment:
  https://testnet.cspr.live/transaction/694147496b0af6dfe83bf0a32cecd16ae6e09b8a141087f6cc0bcffea0f252c0
- Contract hash:
  `e5c63c54f0c147703548976c174087d4a8e087da191adc2f466fa101e1154a3a`
- Package hash:
  `aacf4a08413e873bb3f67b2d7ce78230e3d3e2bde558c2203bd55b1a37853345`

### Risk credential write

- Entry point: `record_credential`
- Transaction:
  https://testnet.cspr.live/transaction/2267d02bb600d20d500a6c670bdda5576ef5ab950db04f63302266538a1159d9
- Asset: `invoice:demo-acme-batch`
- Score / decision: `78 / Eligible`
- Dictionary key:
  `dictionary-11983ddea2cdd494ee8d074580ff8fec97e7a95b122380ecb44a6dc72f52e860`

### Execution intent write

- Entry point: `record_execution_intent`
- Transaction:
  https://testnet.cspr.live/transaction/e84e316b075fd257f42e91229cdf7762f8089993b01ea64f5e989303360886f6
- Intent: `intent-09f5ecde`
- Decision / authorization: `Approve / policy_key`
- Principal cap: `$125,000`
- Policy result: `9 / 9 checks passed`
- Dictionary key:
  `dictionary-38a776d306dab1d720019cc91f9734e0a71570e0160affb5a567f50b621f9f96`

## Repeatable Evidence

```bash
npm run casper:read:registry
npm run casper:read:execution -- --intent-id=intent-09f5ecde
npm run verify
npm audit --audit-level=high
```

The readback commands query Casper RPC without a private key. The full verification suite builds
every workspace, runs domain/API/Casper tests, exercises the product flow, and checks the
30-case policy benchmark.

## Evaluation Evidence

The deterministic benchmark contains 30 labeled cases and covers every policy failure mode:

- risk score floor
- collateral coverage
- advance-rate ceiling
- liquidity buffer
- evidence freshness
- single-asset exposure
- sanctions screening
- credential verification
- replay protection

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
