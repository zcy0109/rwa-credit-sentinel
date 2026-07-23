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
2267d02bb600d20d500a6c670bdda5576ef5ab950db04f63302266538a1159d9

Explorer:
https://testnet.cspr.live/transaction/2267d02bb600d20d500a6c670bdda5576ef5ab950db04f63302266538a1159d9

Asset:
invoice:demo-acme-batch

Risk score / decision:
78 / Eligible

Dictionary key:
dictionary-11983ddea2cdd494ee8d074580ff8fec97e7a95b122380ecb44a6dc72f52e860
```

### Execution intent

```text
Entry point:
record_execution_intent

Transaction:
e84e316b075fd257f42e91229cdf7762f8089993b01ea64f5e989303360886f6

Explorer:
https://testnet.cspr.live/transaction/e84e316b075fd257f42e91229cdf7762f8089993b01ea64f5e989303360886f6

Intent:
intent-09f5ecde

Decision / authorization:
Approve / policy_key

Principal cap:
125000 USD

Intent hash:
a22b8596a3648937b165985d94c045a7660e9b1f1bee8fdac414407987e71a6e

Dictionary key:
dictionary-38a776d306dab1d720019cc91f9734e0a71570e0160affb5a567f50b621f9f96
```

## Public Readback

No private key is required:

```bash
npm run casper:read:registry
npm run casper:read:execution -- --intent-id=intent-09f5ecde
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
npm run casper:read:execution -- --intent-id=intent-09f5ecde
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
