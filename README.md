# RWA Credit Sentinel

RWA Credit Sentinel is a bounded autonomous underwriting and capital-action system for
invoice-backed financing. It turns public evidence into an explainable risk credential, verifies
that credential against policy, caps executable principal, and anchors both the credential and the
resulting execution intent on Casper Testnet.

Built for the **Casper Agentic Buildathon 2026 Finals**.

[![CI](https://github.com/zcy0109/rwa-credit-sentinel/actions/workflows/ci.yml/badge.svg)](https://github.com/zcy0109/rwa-credit-sentinel/actions/workflows/ci.yml)
[![CodeQL](https://github.com/zcy0109/rwa-credit-sentinel/actions/workflows/codeql.yml/badge.svg)](https://github.com/zcy0109/rwa-credit-sentinel/actions/workflows/codeql.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## Finals Evidence

The finals contract exposes two application-level state transitions:

| Evidence | Casper Testnet proof |
| --- | --- |
| Contract deploy | [`3a305e...591c`](https://testnet.cspr.live/transaction/3a305efe3c72339e00655a0eace4d5f0ba11514717241204fab6029a458e591c) |
| Risk credential write | [`da9174...ebd6`](https://testnet.cspr.live/transaction/da9174726c74f11ae54e47368f933b3e0effc48e1ac376ff0f34a77d632cebd6) |
| Execution intent write | [`681751...542a`](https://testnet.cspr.live/transaction/68175104219126eee20876aa7446301888338838bb1430bd1ce01c5ebbe2542a) |

- Contract hash: `6a248275de2c4518a9adb4996d62183e0a10899cd0b9080274cf72504ed9cd4f`
- Package hash: `2c34005155776d58709aa092eadb967b60d024a99e2073e131ec500a7e98358f`
- Published asset: `invoice:acme-export-invoice-pool-finals`
- Published intent: `intent-b781ee81`
- Evidence manifest hash: `06e0a311d67f64e116fc2f0f134bbfa9b438e8f0e7c733d636080ff8a2a3420d`
- Intent hash: `7485dc82989896680b6f6353c170ab9e4327541973c3dabca0118c57d560aa0b`
- Decision: `Approve`
- Authorization: `policy_key`
- Principal cap: `$125,000`
- Policy result: `9/9` checks passed

The original qualification contract remains verifiable in
[`contracts/risk-registry/DEPLOYMENTS.md`](contracts/risk-registry/DEPLOYMENTS.md).

The app also exposes **Verify live contract state**. It reads both dictionaries from Casper RPC
without a wallet and compares 13 contract fields with the published evidence. This is state
verification, not a screenshot or a cached transaction claim.

## Qualification Prototype vs Finals Product

| Capability | Qualification prototype | Finals v3 |
| --- | --- | --- |
| Agent workflow | Four underwriting agents | Eight underwriting and bounded-execution agents |
| Casper evidence | Risk credential write | Risk credential and execution-intent state |
| Capital authority | Financing recommendation | Nine locked policy checks and explicit authorization |
| Failure handling | Eligible / review / rejected | Approve / reviewer multisig / zero-capital block |
| Evidence integrity | URL-reference digest | Four-document content hashes and manifest hash |
| Verification | CLI readback | One-click live RPC comparison of 13 fields plus CLI |
| Evaluation | Unit tests | 30-case policy benchmark, tests, CodeQL, and audit bundle |

The detailed evolution and deliberately excluded scope are documented in
[`docs/EVOLUTION.md`](docs/EVOLUTION.md).

## Judge Quickstart

```bash
npm ci
npm run verify
npm run dev
```

Open `http://127.0.0.1:5173`.

The local app defaults to deterministic mock adapters, so the complete workflow can be reviewed
without a wallet, private key, or Testnet CSPR. Published Testnet evidence is displayed separately
and is never presented as the current local run.

### Five-minute test path

1. Select **Verify live contract state** and confirm `5/5` credential and `8/8` intent checks.
2. Select **Load sample**, inspect the explicitly synthetic evidence pack, then run underwriting.
3. Review four document hashes, the manifest hash, risk factors, report hash, and evidence hash.
4. Keep **Autonomous** mode and select **Evaluate capital action**; inspect all nine checks.
5. Raise advance rate above `80%` and evaluate to see reviewer-multisig routing.
6. Clear **Credential verified** and evaluate to see a `$0` blocked capital allocation.
7. Restore the sample, approve it, and download the complete audit bundle.
8. **Anchor execution intent** uses a deterministic mock locally; use the published Testnet proof
   for the already anchored finals record.

## Why Casper Is Required

An off-chain score alone can be changed, selectively disclosed, or detached from the decision that
consumed it. This system creates a verifiable chain:

```text
content-hashed evidence manifest
  -> explainable risk report
  -> Casper risk credential
  -> deterministic vault policy
  -> bounded execution intent
  -> Casper execution-intent state
```

The credential binds the score and evidence digest to an issuer. The execution intent then binds
the resulting decision, authorization path, and principal ceiling back to the credential's report
hash. A lender can independently query both contract dictionaries.

## Agent Workflow

The system is intentionally not a chatbot or an LLM wrapper.

1. **Data Agent** normalizes the financing request and public evidence references.
2. **Risk Agent** produces explainable factor scores and a credit-risk result.
3. **Verification Agent** creates canonical report and evidence hashes.
4. **Decision Agent** issues the underwriting credential.
5. **Credential Agent** verifies that credential before it can be consumed.
6. **Policy Agent** evaluates nine hard and soft vault boundaries.
7. **Capital Agent** computes a risk-adjusted principal cap.
8. **Execution Agent** assigns `policy_key`, `reviewer_multisig`, or `none` authority and anchors
   the intent.

Autonomy is bounded by explicit policy. Hard failures block capital; soft exceptions route to
human review; only a fully verified request above the autonomous score threshold receives
policy-key authorization.

## Safety Boundaries

The execution policy checks:

- Casper credential verification
- Exact report-hash match
- Covenant status
- Minimum risk score
- Minimum collateral ratio
- Maximum advance rate
- Minimum liquidity buffer
- Evidence freshness
- Single-asset exposure

The repository includes a deterministic 30-case benchmark covering all nine failure modes. It
reports decision agreement, decision distribution, and invalid-credential block rate.

## Contract

Entry points:

- `record_credential(asset_id, risk_score, decision, report_hash, evidence_hash, created_at_ms)`
- `get_credential(asset_id)`
- `record_execution_intent(intent_id, asset_id, report_hash, decision, authorization, principal_cap_usd, intent_hash, created_at_ms)`
- `get_execution_intent(intent_id)`
- `owner()`

Read the two published records without a private key:

```bash
npm run casper:read:registry
npm run casper:read:execution -- --intent-id=intent-b781ee81
```

## API

- `POST /api/evidence/intake`
- `GET /api/evidence/sample`
- `POST /api/reports`
- `GET /api/credentials`
- `GET /api/credentials/:assetId`
- `POST /api/execution/evaluate`
- `POST /api/execution/anchor`
- `GET /api/execution/intents`
- `GET /api/execution/intents/:intentId`
- `GET /api/execution/receipts/:intentId`
- `GET /api/execution/benchmark`
- `GET /api/casper/verify-finals`

The browser submits only an `intentId` to the anchor endpoint. The server retrieves the previously
evaluated canonical intent and signs it outside the browser. Repeated anchor requests are
idempotent.

The evidence endpoint accepts small JSON, CSV, TXT, or PDF files and recomputes content hashes on
the server. It proves byte integrity, not the truth of commercial claims. The receipt endpoint
exports the complete evidence, agent, policy, current-run, and published-Testnet audit trail with
its own receipt hash.

## Repository Layout

- `apps/web` - React decision desk and audit workflow.
- `apps/api` - intake validation, underwriting orchestration, policy API, and server-side anchoring.
- `packages/shared` - domain model, bounded execution engine, and benchmark.
- `packages/casper` - mock/real adapters, deployment, smoke, anchor, and RPC readback scripts.
- `contracts/risk-registry` - native Rust/Wasm Casper registry.
- `docs` - verification, submission, demo, threat model, and launch plan.

Integration and honest external-review material:

- [Integration guide](docs/INTEGRATION.md)
- [Pilot validation protocol](docs/PILOT_VALIDATION.md)

## Verification

```bash
npm run verify
npm audit --registry=https://registry.npmjs.org --audit-level=high
```

`npm run verify` builds every workspace, runs all tests, checks both contract state paths, checks
the production bundle for the published finals evidence, and exercises the full API flow in mock
mode.

Real-mode commands require a funded Testnet key:

```bash
npm run casper:preflight
npm run casper:smoke:real
npm run casper:anchor:execution
npm run casper:read:registry
npm run casper:read:execution -- --intent-id=intent-b781ee81
```

Private keys, seed phrases, `.env`, and `.secrets/` must never be committed.

## Scope

This prototype does not provide investment advice, custody assets, execute trades, ingest private
KYC documents, or transfer principal. It proves the underwriting-to-authorized-intent boundary.
A production deployment would add regulated identity, oracle-backed evidence, multi-issuer
governance, key management, and a separately audited settlement contract.

## Launch Plan

The product has a gated 30/90/180-day path from public Testnet pilot to a controlled design-partner
trial and, only after legal and security approval, an audited limited launch. The plan includes
measurable exit criteria, shadow-mode testing, policy versioning, multisig review, evidence
provenance, and a reusable Casper integration SDK.

See [docs/LAUNCH_PLAN.md](docs/LAUNCH_PLAN.md) and
[docs/THREAT_MODEL.md](docs/THREAT_MODEL.md).

## Security and Community

The repository includes CI, CodeQL, Dependabot, issue templates, a pull request template,
`SECURITY.md`, `CONTRIBUTING.md`, a code of conduct, and an MIT license.

Recommended repository topics:
`casper-blockchain`, `casper-network`, `buildathon`, `rwa`, `defi`, `agentic-ai`.
