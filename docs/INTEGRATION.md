# Integration Guide

RWA Credit Sentinel is a narrow underwriting and authorization service. An originator submits
evidence, receives a risk credential, evaluates it against a server-owned vault policy, and
exports a decision receipt. The service does not custody or settle funds.

## End-to-End API Path

### 1. Submit evidence bytes

`POST /api/evidence/intake`

```json
{
  "label": "Pilot invoice register",
  "files": [
    {
      "name": "invoice-register.json",
      "mediaType": "application/json",
      "evidenceType": "invoice_register",
      "contentBase64": "W3siaW52b2ljZU51bWJlciI6IklOVi0wMDEifV0="
    }
  ]
}
```

The server accepts up to six JSON, CSV, TXT, or PDF files. Each file is limited to 1 MB and the
bundle to 4 MB. It recomputes SHA-256 from the submitted bytes and returns an
`evidenceBundleId`. PDF files are hashed but not parsed.

Content integrity is not claim verification. An integration must perform its own source,
identity, legal, and fraud checks.

### 2. Create a risk credential

`POST /api/reports`

Pass the returned `evidenceBundleId` with the financing request. The response contains the risk
report, agent provenance, evidence manifest, Casper adapter result, and exact
`record_credential` call preview.

### 3. Evaluate capital boundaries

`POST /api/execution/evaluate`

The caller supplies current collateral, liquidity, evidence-freshness, and credential status.
The server ignores caller-supplied policy values and applies its own locked policy.

### 4. Anchor an execution intent

`POST /api/execution/anchor`

The browser sends only `intentId`. The server retrieves the previously evaluated canonical
intent, hashes it, and uses the configured Casper adapter. Repeated requests are idempotent.

### 5. Export the decision receipt

`GET /api/execution/receipts/:intentId`

The receipt binds:

- the evidence manifest and integrity limitation
- underwriting and execution agent traces
- agent runtime provenance and autonomy boundaries
- the risk and policy decisions
- current-run proof and published Casper Testnet proof
- the policy-conformance benchmark and its limitation
- an integrity hash for the complete receipt

## Production Boundary

A production integrator must add durable storage, authentication, rate limiting, regulated
identity, source verification, HSM-backed signing, incident response, independent security
review, and a separately governed settlement component.
