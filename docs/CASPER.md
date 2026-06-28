# Casper Integration

## Current Integration Strategy

The project supports three Casper attestation paths:

- `mock`: deterministic local attestation for demos without secrets.
- `contract-registry`: real Casper Testnet contract call to `record_credential`.
- `native-transfer-memo`: fallback historical proof path using a Casper Testnet self-transfer.

The buildathon submission's primary Casper integration is the deployed Risk Registry contract. The API can map a risk credential into Casper runtime arguments, submit a `record_credential` deploy, wait for execution, and return the transaction hash, contract hash, and explorer URL.

## Testnet Evidence

### Contract Deployment

```text
Deploy hash:
735dab5995084abfe4494398ff6f3c6677055a4d5025b79918ae9c4a202a93b9

Explorer:
https://testnet.cspr.live/transaction/735dab5995084abfe4494398ff6f3c6677055a4d5025b79918ae9c4a202a93b9

Block height:
8320720

Contract hash:
aeda10dacdee9cefa8b857c3f6c8a0b2edeb6c19421f16189016ab1a2359b391

Package hash:
2765865230aba876704f1b793b2a124adcdf532336c9b455de692ea885637df3
```

### Real Credential Registry Write

```text
Transaction hash:
096907b2961fe30d01d0267a2876922225d2b43e37f124a40608330e500341f0

Explorer:
https://testnet.cspr.live/transaction/096907b2961fe30d01d0267a2876922225d2b43e37f124a40608330e500341f0

Entry point:
record_credential

Asset ID:
invoice:demo-acme-batch

Risk score:
78

Decision:
Eligible

Issuer public key:
0202a88b97ebb35fc1a2352d24ab37347fe5d909561cf41ba9f1af9c1d84e1bcd5db
```

### Registry Readback

The written credential can be read back from Casper RPC without a private key:

```bash
npm run casper:read:registry
```

Verified readback:

```json
{
  "asset_id": "invoice:demo-acme-batch",
  "risk_score": 78,
  "decision": "Eligible",
  "report_hash": "9fd81df9ea02d7448837e020ba84ebc45904cf52adeefe628cb31f5aa8f65d0ed",
  "evidence_hash": "4df81df9ea02d7448837e020ba84ebc45904cf52adeefe628cb31f5aa8f65d0aa"
}
```

### Historical Fallback Transfer Proof

The project also produced an earlier Casper Testnet native-transfer memo proof:

```text
https://testnet.cspr.live/transaction/34e2e8d36239d4f96dc2d5e38337a1834c6289ebbfc4ca24e99619ccfc6d1b65
```

This is retained as a fallback integration path, but the submitted product path is the registry contract write above.

## Contract Entry Points

The dedicated Casper contract in `contracts/risk-registry` exposes:

- `record_credential(asset_id, risk_score, decision, report_hash, evidence_hash, created_at_ms)`
- `get_credential(asset_id)`
- `owner()`

The contract stores:

- Asset ID
- Risk score
- Decision
- Report hash
- Evidence hash
- Issuer account
- Created timestamp

The owner check models a real underwriter or risk-credential issuer authority.

## Environment

Copy `.env.example` to `.env` and set:

```bash
CASPER_MODE=real
CASPER_RPC_URL=https://node.testnet.casper.network/rpc
CASPER_CHAIN_NAME=casper-test
CASPER_PRIVATE_KEY_PEM_FILE=.secrets/Account_1_secret_key.pem
CASPER_KEY_ALGORITHM=SECP256K1
CASPER_RISK_REGISTRY_HASH=aeda10dacdee9cefa8b857c3f6c8a0b2edeb6c19421f16189016ab1a2359b391
CASPER_CONTRACT_CALL_PAYMENT_MOTES=20000000000
```

Use `CASPER_KEY_ALGORITHM=SECP256K1` when the Casper public key starts with `02`.
Use `CASPER_KEY_ALGORITHM=ED25519` when the Casper public key starts with `01`.

Do not commit `.env`, private keys, seed phrases, or funded account secrets.

## Commands

Mock smoke test:

```bash
npm --workspace packages/casper run smoke:mock
```

Real-mode preflight:

```bash
npm run casper:preflight
```

Deploy the registry contract:

```bash
npm run casper:deploy:registry
```

Write a real credential to the deployed registry contract:

```bash
npm run casper:smoke:real
```

Read the verified credential back from the deployed registry contract:

```bash
npm run casper:read:registry
```

## Contract Build

The contract source compiles to Casper-compatible Wasm with Rust nightly, the `wasm32-unknown-unknown` target, and Binaryen lowering:

```bash
cargo +nightly build -Z build-std=core,alloc --target wasm32-unknown-unknown --release
npm exec --yes --package=binaryen@130.0.0 -- wasm-opt \
  target/wasm32-unknown-unknown/release/rwa_risk_registry.wasm \
  --mvp-features \
  --llvm-memory-copy-fill-lowering \
  -Oz \
  -o wasm/RiskRegistry.wasm
```

The optimized deployable artifact is:

```text
contracts/risk-registry/wasm/RiskRegistry.wasm
```

## Funding A Testnet Account

1. Create or import a Casper Testnet account.
2. Copy the public key shown by `npm run casper:preflight` or your wallet.
3. Request Testnet CSPR from the official CSPR.live testnet faucet.
4. Wait for the faucet transaction to finalize.
5. Re-run `npm run casper:preflight`.
6. If the balance check passes, run `npm run casper:smoke:real`.
