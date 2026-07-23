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
3a305efe3c72339e00655a0eace4d5f0ba11514717241204fab6029a458e591c

Explorer:
https://testnet.cspr.live/transaction/3a305efe3c72339e00655a0eace4d5f0ba11514717241204fab6029a458e591c

Contract hash:
6a248275de2c4518a9adb4996d62183e0a10899cd0b9080274cf72504ed9cd4f

Package hash:
2c34005155776d58709aa092eadb967b60d024a99e2073e131ec500a7e98358f
```

### Risk credential

```text
Entry point:
record_credential

Transaction:
da9174726c74f11ae54e47368f933b3e0effc48e1ac376ff0f34a77d632cebd6

Explorer:
https://testnet.cspr.live/transaction/da9174726c74f11ae54e47368f933b3e0effc48e1ac376ff0f34a77d632cebd6

Asset:
invoice:acme-export-invoice-pool-finals

Risk score / decision:
80 / Eligible

Dictionary key:
dictionary-0d1ae99a898ca2cbcee6372256ed77868577ec045e5071998ffb0caa7fc2ad52
```

### Execution intent

```text
Entry point:
record_execution_intent

Transaction:
68175104219126eee20876aa7446301888338838bb1430bd1ce01c5ebbe2542a

Explorer:
https://testnet.cspr.live/transaction/68175104219126eee20876aa7446301888338838bb1430bd1ce01c5ebbe2542a

Intent:
intent-b781ee81

Decision / authorization:
Approve / policy_key

Principal cap:
125000 USD

Intent hash:
7485dc82989896680b6f6353c170ab9e4327541973c3dabca0118c57d560aa0b

Dictionary key:
dictionary-eb1679fc5cd63e7b8f27d74990415252d74d36f58ba26ecbb26426d3ea7816db
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
CASPER_RISK_REGISTRY_HASH=6a248275de2c4518a9adb4996d62183e0a10899cd0b9080274cf72504ed9cd4f
CASPER_RISK_REGISTRY_PACKAGE_HASH=2c34005155776d58709aa092eadb967b60d024a99e2073e131ec500a7e98358f
CASPER_CONTRACT_CALL_PAYMENT_MOTES=20000000000
```

Never commit `.env`, private keys, seed phrases, or funded account secrets.

## Commands

```bash
npm --workspace packages/casper run smoke:mock
npm run casper:preflight
npm run casper:deploy:registry
npm run casper:smoke:real
npm run casper:anchor:credential
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
