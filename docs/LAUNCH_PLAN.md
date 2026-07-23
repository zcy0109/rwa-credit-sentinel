# Launch Plan

RWA Credit Sentinel is designed to become a narrow, auditable underwriting-policy service for
invoice-backed financing on Casper. The first launch target is not a general lending protocol. It
is a reliable credential and authorization layer that existing lenders can integrate.

## First 30 Days: Public Testnet Pilot

- Keep the finals contract and public readback service continuously reproducible.
- Publish the risk credential and execution intent schemas as versioned integration contracts.
- Add indexed contract-state retrieval so partners can query by asset and intent without a local
  key.
- Replace demo evidence URLs with one consented, synthetic-or-public receivables dataset.
- Interview three to five RWA lenders, treasury managers, or protocol builders to validate the
  nine policy boundaries and audit-bundle format.

Exit gate:

- one external integration can submit a sample request, retrieve both Casper records, and verify
  the canonical hashes
- no private data or signing material enters the model context
- all high and critical security findings remain resolved

## Days 31-90: Controlled Design-Partner Trial

- Add issuer allowlisting, policy versioning, reviewer roles, and multisig approval receipts.
- Add evidence-source adapters with provenance timestamps and explicit confidence labels.
- Store credential history rather than only the latest record.
- Expose a stable read-only SDK for DeFi eligibility checks.
- Run a shadow trial: produce recommendations and proofs without moving capital.

Success metrics:

- median request-to-credential time
- percentage of decisions independently reproduced from the audit bundle
- reviewer override and exception rates
- stale-evidence detection rate
- contract readback availability

## Days 91-180: Audited Limited Launch

- Commission independent contract, API, and key-management reviews.
- Add regulated identity and privacy controls appropriate to the chosen jurisdiction.
- Separate policy authorization from settlement into independently governed contracts.
- Pilot one capped receivables pool with explicit human approval and monitored exposure limits.
- Evaluate x402 for paid evidence queries only when the production Casper primitive and economics
  are suitable.

Launch gates:

- legal and compliance approval for the exact operating model
- audited contracts and documented key rotation
- incident response and rollback procedures
- lender-approved policy and maximum exposure
- ongoing evidence-quality monitoring

## Casper Ecosystem Contribution

The project can contribute reusable Casper primitives rather than remain a single demo:

- an open risk-credential schema
- an open bounded-execution-intent schema
- reference Rust/Wasm registry contracts
- public RPC readback examples
- a deterministic policy benchmark for agent authorization

The intended ecosystem effect is to make Casper a verifiable control layer between off-chain RWA
analysis and on-chain financial action.

## Distribution

- Open-source releases and technical updates through the GitHub repository.
- Integration discussions through Casper developer Telegram and Discord channels.
- A public DoraHacks finals page and demo video for reproducible evaluation.
- Direct design-partner outreach to RWA lenders and DeFi treasury teams after the finals.
