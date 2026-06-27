# Casper Risk Registry Contract

This folder contains the Casper smart-contract layer for RWA Credit Sentinel.

The contract is a dedicated on-chain registry that stores the latest risk credential per RWA asset
ID. It gives the buildathon prototype a real Casper Testnet contract hash, not only a native
transfer proof.

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
- The owner check models a real issuer/underwriter authority.

## Current Status

The contract source compiles locally to Casper Wasm with Rust nightly, the `wasm32-unknown-unknown`
target, and the native `casper-contract` APIs. The optimized Casper-compatible deployable artifact is:

`wasm/RiskRegistry.wasm`

The raw contract Wasm is compiled first, then lowered to MVP Wasm with Binaryen so Casper Testnet
accepts it without bulk-memory opcodes:

```bash
cargo +nightly build -Z build-std=core,alloc --target wasm32-unknown-unknown --release
npm exec --yes --package=binaryen@130.0.0 -- wasm-opt \
  target/wasm32-unknown-unknown/release/rwa_risk_registry.wasm \
  --mvp-features \
  --llvm-memory-copy-fill-lowering \
  -Oz \
  -o wasm/RiskRegistry.wasm
```

Deploy it to Casper Testnet with:

```bash
npm run casper:deploy:registry
```

The buildathon prototype still keeps the native-transfer attestation path as a fallback proof. The
next integration step is to call this registry contract's `record_credential` entry point from the
API and show the contract hash in the frontend.

## Planned Integration Steps

1. Install Rust, Wasm target, and Odra tooling.
2. Compile this contract to Wasm.
3. Deploy it on Casper Testnet.
4. Add `CASPER_RISK_REGISTRY_HASH` to `.env`.
5. Implement a `CasperRegistryAttestationAdapter` that calls `record_credential`.
6. Show the contract package hash and transaction hash in the frontend.
