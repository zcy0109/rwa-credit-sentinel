# Casper Risk Registry Contract

This folder contains the planned Casper smart-contract layer for RWA Credit Sentinel.

The current buildathon prototype can already create a Casper Testnet native transfer attestation through `packages/casper`. This contract is the next step: a dedicated on-chain registry that stores the latest risk credential per RWA asset ID and emits an event for DeFi protocols and underwriters.

## Contract Shape

Entry points:

- `init()` - sets the deployer as the registry owner.
- `record_credential(asset_id, risk_score, decision, report_hash, evidence_hash, created_at_ms)` - writes the latest credential for an asset.
- `get_credential(asset_id)` - returns the latest credential for an asset.
- `owner()` - returns the account allowed to record credentials.

Stored record:

- `asset_id`
- `risk_score`
- `decision`
- `report_hash`
- `evidence_hash`
- `issuer`
- `created_at_ms`

## Why This Matters

The native-transfer path proves a transaction-producing Casper integration. The registry contract makes the Casper contribution product-native:

- DeFi lending pools can query Casper for the latest credential.
- The report hash and evidence hash become contract state, not only transaction metadata.
- Events create an indexable audit trail for risk updates.
- The owner check models a real issuer/underwriter authority.

## Current Status

This is a source blueprint. Rust/Cargo are not installed in the current Windows workspace, so it has not been compiled or deployed here yet.

Before final submission or finals, compile with the Casper/Odra toolchain, deploy to Casper Testnet, and replace the native-transfer adapter with a contract-call adapter.

## Planned Integration Steps

1. Install Rust, Wasm target, and Odra tooling.
2. Compile this contract to Wasm.
3. Deploy it on Casper Testnet.
4. Add `CASPER_RISK_REGISTRY_HASH` to `.env`.
5. Implement a `CasperRegistryAttestationAdapter` that calls `record_credential`.
6. Show the contract package hash and transaction hash in the frontend.
