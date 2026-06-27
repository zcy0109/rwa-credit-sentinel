# RWA Credit Sentinel

Agentic RWA credit-risk assessment with Casper Testnet attestation and a DeFi financing gate.

Built for **Casper Agentic Buildathon 2026**.

## Thesis

RWA lending needs trustworthy off-chain risk signals. RWA Credit Sentinel turns an agentic risk assessment into a verifiable Casper credential: the AI agents evaluate an invoice or asset-backed financing request, generate a structured risk report, hash the evidence, and anchor the risk credential to Casper so a DeFi lending gate can make an auditable eligibility decision.

## What It Does

1. A user submits an RWA financing request.
2. The API runs a multi-agent risk workflow:
   - Data Agent
   - Risk Agent
   - Verification Agent
   - Decision Agent
3. The system generates a risk score, decision, report hash, and evidence hash.
4. The Casper adapter anchors the credential:
   - `mock` mode for local demos.
   - `real` mode for Casper Testnet native transfer memo attestation.
5. The API stores the latest risk credential in a local registry.
6. The repo includes a Casper Risk Registry contract blueprint for the final on-chain credential store.
7. The frontend displays the risk report, agent trace, Casper credential, DeFi gate result, and recent credential registry.

## Architecture

- `apps/api` - Express API, RWA intake validation, risk-agent workflow.
- `apps/web` - Vite React demo UI.
- `packages/shared` - shared domain types and DeFi gate logic.
- `packages/casper` - Casper mock adapter and real `casper-js-sdk` adapter.
- `contracts/risk-registry` - Odra/Rust Casper contract blueprint for risk credential storage.
- `docs` - strategy, Casper setup, build log, acceptance checklist, and submission materials.

## API Surface

- `GET /health`
- `POST /api/reports`
- `GET /api/credentials`
- `GET /api/credentials/:assetId`

## Quick Start

```bash
npm install
npm run dev
```

Open:

```text
http://127.0.0.1:5173
```

API health:

```text
http://127.0.0.1:8787/health
```

## Verification

```bash
npm test
npm run build
npm --workspace packages/casper run smoke:mock
```

Full local verification:

```bash
npm run verify
```

See [docs/VERIFICATION.md](docs/VERIFICATION.md).

## Casper Testnet Mode

The app runs in mock mode by default. To send a real Casper Testnet transaction, copy `.env.example` to `.env` and provide a funded testnet private key.

```bash
CASPER_MODE=real
CASPER_PRIVATE_KEY_HEX=...
CASPER_KEY_ALGORITHM=ED25519
```

See [docs/CASPER.md](docs/CASPER.md).

Before sending a real transaction, run:

```bash
npm run casper:preflight
npm run casper:smoke:real
```

## Casper Risk Registry Contract

The final on-chain design is in [contracts/risk-registry](contracts/risk-registry). It defines a Casper registry for `record_credential` and `get_credential`, storing the risk score, decision, report hash, evidence hash, issuer, and timestamp for each RWA asset ID.

The TypeScript Casper package already includes the argument mapping for this contract, so the next upgrade is replacing the native-transfer attestation adapter with a contract-call adapter once Rust/Odra tooling and a funded testnet key are available.

Every API report response also includes a `registryCall` preview with the `record_credential` entry point and the exact arguments that should be sent to the deployed registry contract.

## Current Status

The local prototype is functional. Real Casper Testnet mode is implemented, but submitting a real transaction requires a funded Casper Testnet key. The Casper Risk Registry contract is scaffolded as a source blueprint and still needs Rust/Odra compilation and deployment.

## Safety

This prototype does not provide investment advice, custody assets, execute trades, or process private KYC documents. It demonstrates an auditable RWA risk credential workflow for buildathon evaluation.
