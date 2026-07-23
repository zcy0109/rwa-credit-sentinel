# Casper Integration

## Finals Architecture

The deployed Risk Registry contract provides two linked Casper state transitions:

1. `record_credential` stores an issuer-bound underwriting credential.
2. `record_execution_intent` stores the deterministic policy decision that consumes that
   credential.

This separates analysis from authority. The execution record includes the asset, report hash,
decision, authorization mode, principal cap, canonical intent hash, issuer, and timestamp.

## Finals Testnet Evidence

### Contract deployment

```text
Transaction:
694147496b0af6dfe83bf0a32cecd16ae6e09b8a141087f6cc0bcffea0f252c0

Explorer:
https://testnet.cspr.live/transaction/694147496b0af6dfe83bf0a32cecd16ae6e09b8a141087f6cc0bcffea0f252c0

Block height:
8594853

Contract hash:
e5c63c54f0c147703548976c174087d4a8e087da191adc2f466fa101e1154a3a

Package hash:
aacf4a08413e873bb3f67b2d7ce78230e3d3e2bde558c2203bd55b1a37853345
```

### Risk credential

```text
Entry point:
record_credential

Transaction:
b52e4471e09e34a25a5b059bf19ba47764772d46f2c4b328ec6cf57784e0f2ec

Explorer:
https://testnet.cspr.live/transaction/b52e4471e09e34a25a5b059bf19ba47764772d46f2c4b328ec6cf57784e0f2ec

Asset:
invoice:acme-export-invoice-pool-finals

Risk score / decision:
80 / Eligible

Dictionary key:
dictionary-c8aa1ed7710b32d36e4af3a54101716cdc9d03932f3ee13b988bcf4da656d21b
```

### Execution intent

```text
Entry point:
record_execution_intent

Transaction:
78e23db0c0d8aa1f4077c9983fa8b6e394730c21bb6773458c544299456fa3e7

Explorer:
https://testnet.cspr.live/transaction/78e23db0c0d8aa1f4077c9983fa8b6e394730c21bb6773458c544299456fa3e7

Intent:
intent-b781ee81

Decision / authorization:
Approve / policy_key

Principal cap:
125000 USD

Intent hash:
7485dc82989896680b6f6353c170ab9e4327541973c3dabca0118c57d560aa0b

Dictionary key:
dictionary-ee8964520c7812b6cd1e5b5d6f6098b42a0f4f59b3f578929a4de054d7b2928d
```

## Public Readback

No private key is required:

```bash
npm run casper:read:registry
npm run casper:read:execution -- --intent-id=intent-b781ee81
```

The readback output must match the transaction evidence, report hash, decision, authorization,
principal cap, intent hash, and dictionary keys.

## Contract Entry Points

- `record_credential(asset_id, risk_score, decision, report_hash, evidence_hash, created_at_ms)`
- `get_credential(asset_id)`
- `record_execution_intent(intent_id, asset_id, report_hash, decision, authorization, principal_cap_usd, intent_hash, created_at_ms)`
- `get_execution_intent(intent_id)`
- `owner()`

Only the contract owner can write registry records. This models an authorized underwriter or
policy executor. Public users can verify dictionary state without the signing key.

## Modes

- `mock`: deterministic local attestation for repeatable judge testing.
- `real`: owner-signed Casper Testnet contract calls.
- `native-transfer-memo`: retained only as a historical fallback path.

Signing is server-side. The browser and agent prompts never receive a private key.

## Environment

```bash
CASPER_MODE=real
CASPER_RPC_URL=https://node.testnet.casper.network/rpc
CASPER_CHAIN_NAME=casper-test
CASPER_PRIVATE_KEY_PEM_FILE=.secrets/Account_1_secret_key.pem
CASPER_KEY_ALGORITHM=SECP256K1
CASPER_RISK_REGISTRY_HASH=e5c63c54f0c147703548976c174087d4a8e087da191adc2f466fa101e1154a3a
CASPER_RISK_REGISTRY_PACKAGE_HASH=aacf4a08413e873bb3f67b2d7ce78230e3d3e2bde558c2203bd55b1a37853345
CASPER_CONTRACT_CALL_PAYMENT_MOTES=20000000000
```

Never commit `.env`, private keys, seed phrases, or funded account secrets.

## Commands

```bash
npm --workspace packages/casper run smoke:mock
npm run casper:preflight
npm run casper:deploy:registry
npm run casper:smoke:real
npm run casper:anchor:execution
npm run casper:read:registry
npm run casper:read:execution -- --intent-id=intent-b781ee81
```

## Contract Build

```bash
cargo +nightly build -Z build-std=core,alloc --target wasm32-unknown-unknown --release
npm exec --yes --package=binaryen@130.0.0 -- wasm-opt \
  target/wasm32-unknown-unknown/release/rwa_risk_registry.wasm \
  --mvp-features \
  --llvm-memory-copy-fill-lowering \
  -Oz \
  -o wasm/RiskRegistry.wasm
```

Deployable artifact:

```text
contracts/risk-registry/wasm/RiskRegistry.wasm
```

The qualification contract remains documented in `contracts/risk-registry/DEPLOYMENTS.md` as a
historical baseline.
