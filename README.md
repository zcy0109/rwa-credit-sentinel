# RWA Credit Sentinel

Agentic RWA credit-risk assessment with a real Casper Testnet credential registry.

Built for **Casper Agentic Buildathon 2026**.

## Submission Snapshot

- GitHub: https://github.com/zcy0109/rwa-credit-sentinel
- Deployed Casper Testnet contract: `aeda10dacdee9cefa8b857c3f6c8a0b2edeb6c19421f16189016ab1a2359b391`
- Contract package: `2765865230aba876704f1b793b2a124adcdf532336c9b455de692ea885637df3`
- Contract deployment: https://testnet.cspr.live/transaction/735dab5995084abfe4494398ff6f3c6677055a4d5025b79918ae9c4a202a93b9
- Real credential write: https://testnet.cspr.live/transaction/096907b2961fe30d01d0267a2876922225d2b43e37f124a40608330e500341f0
- Entry point used: `record_credential`
- Readback command: `npm run casper:read:registry`
- Verification command: `npm run verify`

## Judge Quickstart

```bash
npm install
npm run verify
npm run dev
```

Open:

```text
http://127.0.0.1:5173
```

The app runs in mock mode by default so judges can review it without secrets or Testnet CSPR. The repository and UI include real Casper Testnet evidence from the deployed contract and a verified registry write.

## Thesis

RWA lending needs trustworthy off-chain risk signals. RWA Credit Sentinel turns an agentic risk assessment into a verifiable Casper credential: the agents evaluate an invoice or asset-backed financing request, generate a structured risk report, hash the report and public evidence, and write the credential to a Casper Testnet registry contract. A DeFi lending gate can then make an auditable eligibility decision from the credential.

## What It Does

1. A user submits an RWA financing request.
2. The API runs a deterministic multi-agent risk workflow:
   - Data Agent
   - Risk Agent
   - Verification Agent
   - Decision Agent
3. The system generates a risk score, decision, report hash, and evidence hash.
4. The Casper adapter anchors the credential:
   - `mock` mode for safe repeatable judging.
   - `contract-registry` mode for a real Casper Testnet `record_credential` call.
   - `native-transfer-memo` remains available as a fallback historical proof path.
5. The frontend displays the risk report, agent trace, Casper credential, registry call arguments, DeFi gate result, and recent local credential registry.

## Architecture

- `apps/web` - Vite React demo UI.
- `apps/api` - Express API, RWA intake validation, risk-agent workflow, local credential registry.
- `packages/shared` - shared domain types and DeFi gate logic.
- `packages/casper` - Casper mock adapter, native-transfer fallback, registry contract-call adapter, preflight, deploy, and smoke scripts.
- `contracts/risk-registry` - native Casper Rust contract that stores the latest risk credential per asset ID.
- `docs` - Casper integration notes, submission copy, demo script, verification notes, and acceptance checklist.

## Casper Contract

The deployed registry contract supports:

- `record_credential(asset_id, risk_score, decision, report_hash, evidence_hash, created_at_ms)`
- `get_credential(asset_id)`
- `owner()`

Stored credential fields:

- Asset ID
- Risk score
- Decision
- Report hash
- Evidence hash
- Issuer account
- Created timestamp

The verified buildathon smoke run wrote this credential to the deployed contract:

```text
asset_id: invoice:demo-acme-batch
risk_score: 78
decision: Eligible
entry_point: record_credential
transaction: 096907b2961fe30d01d0267a2876922225d2b43e37f124a40608330e500341f0
```

The registry can be read back from Casper RPC without a private key:

```bash
npm run casper:read:registry
```

Expected readback includes:

```text
asset_id: invoice:demo-acme-batch
risk_score: 78
decision: Eligible
dictionary_key: dictionary-f14bf47bde84eeda7dda934bdac75fc0a6d043027e27cf31b2cf6f8dcd17be45
```

## API Surface

- `GET /health`
- `POST /api/reports`
- `GET /api/credentials`
- `GET /api/credentials/:assetId`

Each `POST /api/reports` response includes:

- `report`: structured agentic risk report.
- `attestation`: Casper credential evidence.
- `registryCall`: exact contract entry point and arguments.

## Verification

```bash
npm test
npm run build
npm --workspace packages/casper run smoke:mock
npm run verify
```

Real Casper Testnet checks, when a funded wallet key is available:

```bash
npm run casper:preflight
npm run casper:smoke:real
npm run casper:read:registry
```

## Casper Testnet Mode

Copy `.env.example` to `.env` and set:

```bash
CASPER_MODE=real
CASPER_PRIVATE_KEY_PEM_FILE=.secrets/Account_1_secret_key.pem
CASPER_KEY_ALGORITHM=SECP256K1
CASPER_RISK_REGISTRY_HASH=aeda10dacdee9cefa8b857c3f6c8a0b2edeb6c19421f16189016ab1a2359b391
```

Use `CASPER_KEY_ALGORITHM=SECP256K1` for public keys starting with `02`, and `ED25519` for public keys starting with `01`.

Private keys, seed phrases, `.env`, and `.secrets/` must never be committed.

## Safety

This prototype does not provide investment advice, custody assets, execute trades, or process private KYC documents. It demonstrates an auditable RWA risk credential workflow for buildathon evaluation.
