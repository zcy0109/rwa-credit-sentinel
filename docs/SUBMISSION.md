# DoraHacks Submission Draft

## Project Name

RWA Credit Sentinel

## Repository

https://github.com/zcy0109/rwa-credit-sentinel

## One-Liner

Agentic RWA credit-risk assessment that anchors verifiable risk credentials to Casper for DeFi financing gates.

## Suggested DoraHacks Summary

RWA Credit Sentinel is an agentic AI underwriting prototype for real-world asset lending. Specialized agents analyze an invoice-backed financing request, generate a risk credential, hash the report and evidence, anchor the credential to Casper Testnet, and expose the result to a DeFi lending gate and credential registry.

The demo includes a working web app, API, deterministic multi-agent risk workflow, local credential registry, real Casper Testnet transaction evidence from the verified smoke run, and an Odra/Rust Risk Registry contract blueprint for the final on-chain registry path.

## Short Description

RWA Credit Sentinel helps DeFi lending systems evaluate real-world asset financing requests. A user submits an invoice or asset-backed financing request, specialized AI agents generate a structured risk report, and the system anchors the report hash and evidence hash to Casper. A DeFi gate then reads the risk credential and classifies the financing request as eligible, review, or rejected.

The prototype also exposes a local credential registry API so financing protocols can query the latest risk credentials by asset ID.

## Tracks / Theme Fit

- Agentic AI: multi-step agent workflow for data normalization, risk scoring, verification, and decisioning.
- RWA: focused on invoice and real-world receivables financing.
- DeFi: risk credential drives financing-pool eligibility and advance-rate decisions.
- Casper: supports Casper Testnet native transfer memo attestation via `casper-js-sdk`.
- Casper final-round path: includes an Odra/Rust Risk Registry contract blueprint for on-chain credential storage.

## Technical Highlights

- TypeScript monorepo with API, frontend, shared domain package, and Casper package.
- Working web demo at `http://127.0.0.1:5173` after `npm run dev`.
- Deterministic report and evidence hashing.
- Agent trace displayed in the UI for judge review.
- Casper adapter supports mock and real modes.
- Real mode sends a Casper Testnet self-transfer with transfer ID derived from report hash.
- Real Casper Testnet evidence: `34e2e8d36239d4f96dc2d5e38337a1834c6289ebbfc4ca24e99619ccfc6d1b65`.
- Explorer link: `https://testnet.cspr.live/transaction/34e2e8d36239d4f96dc2d5e38337a1834c6289ebbfc4ca24e99619ccfc6d1b65`.
- Casper Risk Registry contract blueprint defines `record_credential` and `get_credential` for product-native on-chain credential state.
- TypeScript contract argument mapping is included in `packages/casper`, and every report response includes a `registryCall` preview for the future contract call.
- Local credential registry exposes `GET /api/credentials` and `GET /api/credentials/:assetId`.
- Build, tests, and Casper mock smoke test pass locally.
- Full verification is available with `npm run verify`.
- `npm run casper:preflight` checks real-mode signing key, RPC reachability, and funded balance before submitting a real transaction.

## Demo Flow

1. Open the web app.
2. Review the prefilled invoice-backed RWA financing request.
3. Click "Run agent assessment".
4. Review the risk score and decision.
5. Inspect the four-agent trace.
6. Inspect factor scores.
7. Inspect Casper credential: network, method, transfer ID, transaction hash, report hash, and evidence hash.
8. Show the top proof strip with the real Casper Testnet transaction.
9. Point out that the live credential card is a local mock preview unless the API is started with `CASPER_MODE=real`.
10. Inspect the recent credential registry and show the generated asset ID is queryable.

## Submission Links

- GitHub: `https://github.com/zcy0109/rwa-credit-sentinel`
- Casper Testnet transaction: `https://testnet.cspr.live/transaction/34e2e8d36239d4f96dc2d5e38337a1834c6289ebbfc4ca24e99619ccfc6d1b65`
- Demo video: pending upload

## Current Limitations

- Real Casper Testnet native-transfer attestation is complete; contract registry deployment remains future work.
- Current qualification integration uses native transfer memo attestation; final-round work should add a Casper report registry contract.
- The report registry contract is scaffolded but not compiled or deployed in the current Windows workspace because Rust/Cargo are unavailable.
- Risk scoring is deterministic and explainable; LLM enrichment can be added without changing the credential flow.

## Future Roadmap

- Compile and deploy the Odra/Rust Casper Risk Registry contract for report registry and historical credential queries.
- x402 pay-per-report flow for agentic commerce.
- Data connectors for public filings, invoices, trade receivables, and debtor checks.
- Underwriter dashboard and API for DeFi protocols.
