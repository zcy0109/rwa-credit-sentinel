# Demo Video Script

Target length: 3-5 minutes.

## 0:00 - Problem

RWA lending protocols need risk signals from off-chain assets, but PDF reports and private databases are hard to verify. RWA Credit Sentinel turns an agentic risk analysis into a Casper-anchored credential.

## 0:30 - Intake

Show the financing request form. The sample request is an invoice-backed asset with requested amount, maturity, debtor profile, asset description, and evidence URLs.

## 1:05 - Agent Workflow

Click "Run agent assessment". Explain the four agents:

- Data Agent normalizes the request and evidence references.
- Risk Agent scores maturity, exposure size, evidence coverage, debtor completeness, and narrative completeness.
- Verification Agent prepares evidence and report hashes.
- Decision Agent maps the score to a DeFi financing decision.

## 2:00 - Risk Result

Show the risk score, confidence, and decision. Explain that the decision can drive a financing pool gate: eligible, review, or rejected.

## 2:35 - Casper Credential

Show the Casper credential panel:

- Network
- Method
- Transfer ID
- Transaction hash
- Report hash
- Evidence hash

Explain that real mode uses `casper-js-sdk` to send a Casper Testnet native transfer transaction, with the transfer ID derived from the report hash as an on-chain memo. This anchors the off-chain risk credential to Casper.

## 3:25 - Registry

Show the recent credential registry. Explain that a DeFi protocol or underwriter can query the latest risk credential by asset ID through the API, then compare the report hash and evidence hash with the Casper transaction anchor.

## 3:55 - Architecture

Show README or repo structure:

- `apps/web`
- `apps/api`
- `packages/shared`
- `packages/casper`

Mention that the qualification prototype is local-demo ready, with real Casper Testnet mode enabled when a funded key is provided.

## 4:35 - Roadmap

Explain final-round upgrades:

- Casper report registry contract. Show `contracts/risk-registry` and explain that it stores `asset_id`, `risk_score`, `decision`, `report_hash`, and `evidence_hash` through `record_credential`.
- x402 pay-per-report agent flow.
- More RWA data connectors.
- Underwriter dashboard and DeFi protocol API.
