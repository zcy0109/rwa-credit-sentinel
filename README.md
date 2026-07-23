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
| Contract deploy | [`694147...52c0`](https://testnet.cspr.live/transaction/694147496b0af6dfe83bf0a32cecd16ae6e09b8a141087f6cc0bcffea0f252c0) |
| Risk credential write | [`2267d0...59d9`](https://testnet.cspr.live/transaction/2267d02bb600d20d500a6c670bdda5576ef5ab950db04f63302266538a1159d9) |
| Execution intent write | [`e84e31...86f6`](https://testnet.cspr.live/transaction/e84e316b075fd257f42e91229cdf7762f8089993b01ea64f5e989303360886f6) |

- Contract hash: `e5c63c54f0c147703548976c174087d4a8e087da191adc2f466fa101e1154a3a`
- Package hash: `aacf4a08413e873bb3f67b2d7ce78230e3d3e2bde558c2203bd55b1a37853345`
- Published asset: `invoice:demo-acme-batch`
- Published intent: `intent-09f5ecde`
- Intent hash: `a22b8596a3648937b165985d94c045a7660e9b1f1bee8fdac414407987e71a6e`
- Decision: `Approve`
- Authorization: `policy_key`
- Principal cap: `$125,000`
- Policy result: `9/9` checks passed

The original qualification contract remains verifiable in
[`contracts/risk-registry/DEPLOYMENTS.md`](contracts/risk-registry/DEPLOYMENTS.md).

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

1. Select **Load sample**, then **Run underwriting agents**.
2. Review the score, risk factors, report hash, evidence hash, and credential mode.
3. Keep **Autonomous** mode and the default vault policy.
4. Select **Evaluate capital action** and inspect all nine policy checks.
5. Select **Anchor execution intent**. In local mode this creates a deterministic mock proof.
6. Download the audit bundle.
7. Uncheck **Credential verified** and evaluate again to see capital allocation blocked.
8. Restore the credential, set collateral below `1.15x`, and evaluate again to see reviewer routing.

## Why Casper Is Required

An off-chain score alone can be changed, selectively disclosed, or detached from the decision that
consumed it. This system creates a verifiable chain:

```text
public evidence references
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
npm run casper:read:execution -- --intent-id=intent-09f5ecde
```

## API

- `POST /api/reports`
- `GET /api/credentials`
- `GET /api/credentials/:assetId`
- `POST /api/execution/evaluate`
- `POST /api/execution/anchor`
- `GET /api/execution/intents`
- `GET /api/execution/intents/:intentId`
- `GET /api/execution/benchmark`

The browser submits only an `intentId` to the anchor endpoint. The server retrieves the previously
evaluated canonical intent and signs it outside the browser. Repeated anchor requests are
idempotent.

## Repository Layout

- `apps/web` - React decision desk and audit workflow.
- `apps/api` - intake validation, underwriting orchestration, policy API, and server-side anchoring.
- `packages/shared` - domain model, bounded execution engine, and benchmark.
- `packages/casper` - mock/real adapters, deployment, smoke, anchor, and RPC readback scripts.
- `contracts/risk-registry` - native Rust/Wasm Casper registry.
- `docs` - verification, submission, demo, threat model, and launch plan.

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
npm run casper:read:execution -- --intent-id=intent-09f5ecde
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
