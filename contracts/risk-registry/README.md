# Casper Risk Registry Contract

This folder contains the Casper smart-contract layer for RWA Credit Sentinel.

The contract is a dedicated on-chain registry that links an RWA risk credential to the bounded
capital intent produced from that credential. It gives the finals prototype two independently
queryable Casper state transitions instead of using a transaction hash as a proxy for application
state.

## Contract Shape

Entry points:

- `record_credential(asset_id, risk_score, decision, report_hash, evidence_hash, created_at_ms)` - writes the latest credential for an asset.
- `get_credential(asset_id)` - returns the latest credential for an asset.
- `record_execution_intent(intent_id, asset_id, report_hash, decision, authorization, principal_cap_usd, intent_hash, created_at_ms)` - stores the policy-constrained capital action.
- `get_execution_intent(intent_id)` - returns the stored execution intent.
- `owner()` - returns the account allowed to record credentials.

Stored record:

- `asset_id`
- `risk_score`
- `decision`
- `report_hash`
- `evidence_hash`
- `issuer`
- `created_at_ms`

Stored execution intent:

- `intent_id`
- `asset_id`
- `report_hash`
- `decision`
- `authorization`
- `principal_cap_usd`
- `intent_hash`
- `issuer`
- `created_at_ms`

## Why This Matters

The native-transfer path proves a transaction-producing Casper integration. The registry contract makes the Casper contribution product-native:

- DeFi lending pools can query Casper for the latest credential and the resulting capital intent.
- The report hash and evidence hash become contract state, not only transaction metadata.
- The execution intent binds a policy decision and principal ceiling back to the credential report.
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

The finals prototype deployed this contract and called both write entry points from TypeScript
through `casper-js-sdk`.

Deployment:

```text
https://testnet.cspr.live/transaction/694147496b0af6dfe83bf0a32cecd16ae6e09b8a141087f6cc0bcffea0f252c0
```

Registry write:

```text
https://testnet.cspr.live/transaction/b52e4471e09e34a25a5b059bf19ba47764772d46f2c4b328ec6cf57784e0f2ec
```

Execution intent write:

```text
https://testnet.cspr.live/transaction/78e23db0c0d8aa1f4077c9983fa8b6e394730c21bb6773458c544299456fa3e7
```

Contract hash:

```text
e5c63c54f0c147703548976c174087d4a8e087da191adc2f466fa101e1154a3a
```

## Integration Checklist

1. Compile this contract to Wasm.
2. Deploy it on Casper Testnet.
3. Add `CASPER_RISK_REGISTRY_HASH` to `.env`.
4. Call `record_credential` from `CasperRegistryAttestationAdapter`.
5. Evaluate a bounded capital action and call `record_execution_intent`.
6. Read both dictionaries back through Casper RPC.
7. Show the contract, package, write transactions, and dictionary keys in the frontend.
