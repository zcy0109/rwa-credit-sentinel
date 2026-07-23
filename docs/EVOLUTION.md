# Product Evolution: Qualification to Finals

## Starting Point

The qualification entry proved a narrow thesis: an agentic underwriting workflow could generate
an explainable RWA risk credential and persist it in a Casper Testnet contract. It was a working
MVP, but the on-chain record stopped at the risk decision. A lender still needed an accountable
way to decide how much capital the agent could control and what happened when policy failed.

## Finals Thesis

The finals product closes that gap:

```text
content-hashed evidence
  -> explainable risk credential
  -> Casper credential state
  -> server-locked vault policy
  -> bounded execution intent
  -> Casper execution-intent state
```

It is no longer only an RWA scoring demo. It is a credential and authorization layer for bounded
agentic finance.

## Material Upgrades

| Area | Qualification | Finals v3 |
| --- | --- | --- |
| Workflow | Four underwriting agents | Eight agents across underwriting and execution |
| Contract state | One credential dictionary | Credential and execution-intent dictionaries |
| Decision output | Credit eligibility | Decision, authority path, and principal ceiling |
| Policy | Financing gate | Nine server-locked hard and soft boundaries |
| Exceptions | Review recommendation | Reviewer multisig or hard zero-capital block |
| Evidence | Hash of submitted URL references | Per-document SHA-256 and canonical manifest hash |
| Chain proof | Transaction links and CLI readback | Links, CLI, and live in-app RPC comparison |
| Auditability | Report hash | Report, evidence manifest, policy snapshot, checks, trace, and intent |
| Evaluation | Focused tests | 30 labeled policy cases plus 21 automated tests across 9 test files |
| Security | Private server-side signer | Signer isolation, idempotency, locked policy, CodeQL, Dependabot |
| Launch path | Prototype | Gated 30/90/180-day design-partner plan |

## Evidence Honesty

The bundled invoice evidence is synthetic and is labeled as such in the UI and API. Its purpose is
to make the complete verification path repeatable without publishing a real company's private
contracts. The integrity mechanism is real: changing any document changes its SHA-256 value and
the manifest hash consumed by the underwriting report.

## Deliberate Boundaries

The product does not move lender funds, claim predictive credit-model accuracy, perform legal
KYC, or ingest private production documents. Those capabilities would expand the security and
regulatory surface without strengthening the finals thesis. The project instead demonstrates the
hard part needed before settlement: verifiable evidence, explicit policy authority, bounded
capital, safe failure, and durable Casper state.
