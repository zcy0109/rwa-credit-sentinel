# Demo Video Script

Target length: 3-5 minutes.

## 0:00 - Problem

RWA lending protocols need risk signals from off-chain assets, but PDF reports and private databases are hard to verify. RWA Credit Sentinel turns an agentic risk analysis into a Casper registry credential.

Show the top proof strip first:

- Deployed Casper Testnet contract.
- Real `record_credential` registry write.
- Contract hash.
- Explorer links.

Use these links:

```text
Contract deployment:
https://testnet.cspr.live/transaction/735dab5995084abfe4494398ff6f3c6677055a4d5025b79918ae9c4a202a93b9

Credential write:
https://testnet.cspr.live/transaction/096907b2961fe30d01d0267a2876922225d2b43e37f124a40608330e500341f0
```

Clarify that the local interactive demo runs in mock mode by default so judges can repeat it without using private keys or Testnet CSPR.

## 0:35 - Intake

Show the financing request form. The sample request is an invoice-backed asset with requested amount, maturity, debtor profile, asset description, and evidence URLs.

## 1:05 - Agent Workflow

Click "Run agent assessment". Explain the four agents:

- Data Agent normalizes the request and evidence references.
- Risk Agent scores maturity, exposure size, evidence coverage, debtor completeness, and narrative completeness.
- Verification Agent prepares evidence and report hashes.
- Decision Agent maps the score to a DeFi financing decision.

## 2:00 - Risk Result

Show the risk score, confidence, and decision. Explain that the decision can drive a financing pool gate: eligible, review, or rejected.

## 2:30 - Casper Credential

Show the Casper credential panel:

- Network.
- Method.
- Transaction hash.
- Report hash.
- Evidence hash.
- Contract hash and entry point when running in real mode.

Explain that real mode uses `casper-js-sdk` to submit a `record_credential` call to the deployed Risk Registry contract.

Mention the readback command:

```bash
npm run casper:read:registry
```

It reads the written `invoice:demo-acme-batch` credential back from Casper RPC.

## 3:10 - Registry Path

Show the registry path panel:

- Entry point: `record_credential`.
- Status: `ready-for-contract-call`.
- Contract hash.
- JSON runtime arguments.

Explain that the same arguments are what the real adapter submitted to Casper Testnet in the verified smoke run.
The readback script confirms the contract dictionary stores the same asset ID, risk score, decision, report hash, and evidence hash.

## 3:45 - Local Credential Registry

Show the recent credential registry. Explain that a DeFi protocol or underwriter can query the latest risk credential by asset ID through the API, then compare the report hash and evidence hash with the Casper registry transaction.

## 4:10 - Architecture

Show README or repo structure:

- `apps/web`
- `apps/api`
- `packages/shared`
- `packages/casper`
- `contracts/risk-registry`

Mention that the project is verified with:

```bash
npm run verify
```

## 4:40 - Roadmap

Explain next upgrades:

- Contract readback UI for live `get_credential` verification.
- Historical credential versions.
- x402 pay-per-report agent flow.
- More RWA data connectors.
- Underwriter dashboard and DeFi protocol API.
