# DoraHacks Submission Draft

## Project Name

RWA Credit Sentinel

## Repository

https://github.com/zcy0109/rwa-credit-sentinel

## One-Liner

Agentic RWA credit-risk assessment that writes verifiable risk credentials to a Casper Testnet registry contract for DeFi financing gates.

## Suggested DoraHacks Summary

RWA Credit Sentinel is an agentic AI underwriting prototype for real-world asset lending. Specialized agents analyze an invoice-backed financing request, generate a structured risk credential, hash the report and evidence, write the credential to a deployed Casper Testnet registry contract, and expose the result to a DeFi lending gate.

The demo includes a working web app, API, deterministic multi-agent risk workflow, local credential registry, real Casper Testnet contract deployment, and a verified `record_credential` write transaction.

The repository also includes a public readback command, `npm run casper:read:registry`, which reads the written credential back from Casper RPC without requiring a private key.

## Short Description

RWA Credit Sentinel helps DeFi lending systems evaluate real-world asset financing requests. A user submits an invoice or asset-backed financing request, specialized agents generate a structured risk report, and the system records the report hash, evidence hash, risk score, decision, and timestamp in a Casper Testnet registry contract. A DeFi gate then classifies the financing request as eligible, review, or rejected.

The prototype also exposes a local credential registry API so financing protocols can query the latest risk credentials by asset ID during the demo.

## Track / Theme Fit

- Agentic AI: multi-step agent workflow for data normalization, risk scoring, verification, and decisioning.
- RWA: focused on invoice and real-world receivables financing.
- DeFi: risk credential drives financing-pool eligibility and advance-rate decisions.
- Casper: deployed native Casper Rust contract plus real Testnet `record_credential` call using `casper-js-sdk`.

## Casper Evidence

Contract deployment:

```text
https://testnet.cspr.live/transaction/735dab5995084abfe4494398ff6f3c6677055a4d5025b79918ae9c4a202a93b9
```

Credential registry write:

```text
https://testnet.cspr.live/transaction/096907b2961fe30d01d0267a2876922225d2b43e37f124a40608330e500341f0
```

Contract hash:

```text
aeda10dacdee9cefa8b857c3f6c8a0b2edeb6c19421f16189016ab1a2359b391
```

Package hash:

```text
2765865230aba876704f1b793b2a124adcdf532336c9b455de692ea885637df3
```

Entry point:

```text
record_credential
```

Readback proof:

```text
npm run casper:read:registry
asset_id: invoice:demo-acme-batch
risk_score: 78
decision: Eligible
dictionary_key: dictionary-f14bf47bde84eeda7dda934bdac75fc0a6d043027e27cf31b2cf6f8dcd17be45
```

## Technical Highlights

- TypeScript monorepo with API, frontend, shared domain package, and Casper package.
- Working web demo at `http://127.0.0.1:5173` after `npm run dev`.
- Deterministic report and evidence hashing.
- Agent trace displayed in the UI for judge review.
- Casper adapter supports `mock`, `native-transfer-memo`, and `contract-registry` modes.
- Native Casper Rust contract stores latest risk credential per asset ID.
- Real mode calls the deployed contract's `record_credential` entry point.
- Public readback script queries the contract dictionary from Casper RPC.
- Every report response includes a `registryCall` preview with the exact contract arguments.
- Local credential registry exposes `GET /api/credentials` and `GET /api/credentials/:assetId`.
- Full verification is available with `npm run verify`.
- `npm run casper:preflight` checks real-mode signing key, RPC reachability, and funded balance.

## Demo Flow

1. Open the web app.
2. Show the top proof strip with the deployed Casper contract and the real registry write.
3. Review the prefilled invoice-backed RWA financing request.
4. Click "Run agent assessment".
5. Review the risk score and decision.
6. Inspect the four-agent trace.
7. Inspect factor scores.
8. Inspect the Casper credential panel.
9. Open the registry path panel and show `record_credential` arguments.
10. Inspect the recent credential registry and explain how a DeFi protocol can query by asset ID.

## Submission Links

- GitHub: `https://github.com/zcy0109/rwa-credit-sentinel`
- Casper contract deployment: `https://testnet.cspr.live/transaction/735dab5995084abfe4494398ff6f3c6677055a4d5025b79918ae9c4a202a93b9`
- Casper credential write: `https://testnet.cspr.live/transaction/096907b2961fe30d01d0267a2876922225d2b43e37f124a40608330e500341f0`
- Demo video: pending upload

## Current Limitations

- Risk scoring is deterministic and explainable; LLM enrichment can be added later without changing the credential flow.
- The local UI defaults to mock mode so judges can run it without private keys or Testnet CSPR.
- The current contract stores the latest credential per asset ID; historical versions and richer query indexing are future work.
- This prototype does not process private KYC documents, custody assets, or execute loans.

## Future Roadmap

- Contract readback UI for live `get_credential` verification.
- Historical credential versions per asset ID.
- x402 pay-per-report agent flow.
- RWA data connectors for invoices, trade receivables, public filings, and debtor checks.
- Underwriter dashboard and DeFi protocol API.
