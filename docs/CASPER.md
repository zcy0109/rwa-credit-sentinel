# Casper Integration

## Current Integration Strategy

The project supports two Casper modes:

- `mock`: deterministic local attestation for demos without secrets.
- `real`: sends a Casper Testnet native transfer transaction using `casper-js-sdk`.

The real-mode adapter creates a self-transfer from the submitter's Casper account to the same account. The transaction transfer ID is deterministically derived from the report hash, so the Casper transaction becomes an on-chain anchor for the off-chain risk credential.

This is a qualification-friendly integration path because it produces a real Casper Testnet transaction while keeping custody and DeFi execution out of scope.

The final-round path is now scaffolded in `contracts/risk-registry`: an Odra/Rust Casper contract blueprint that stores the latest risk credential per asset ID.

## Testnet Evidence

Real Casper Testnet native-transfer attestation was produced from the verified buildathon smoke run:

```text
Transaction hash:
34e2e8d36239d4f96dc2d5e38337a1834c6289ebbfc4ca24e99619ccfc6d1b65

Explorer:
https://testnet.cspr.live/transaction/34e2e8d36239d4f96dc2d5e38337a1834c6289ebbfc4ca24e99619ccfc6d1b65

Block height:
8315213

Block hash:
ca56cb75fa821eabe1aa69fd9f5578c1663a7c720ae08751ee7579afb3ce3a28

Issuer public key:
0202a88b97ebb35fc1a2352d24ab37347fe5d909561cf41ba9f1af9c1d84e1bcd5db

Method:
native-transfer-memo

Transfer ID:
175750564669954
```

## Environment

Copy `.env.example` to `.env` and set:

```bash
CASPER_MODE=real
CASPER_PRIVATE_KEY_HEX=...
CASPER_KEY_ALGORITHM=ED25519
```

or:

```bash
CASPER_MODE=real
CASPER_PRIVATE_KEY_PEM="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
CASPER_KEY_ALGORITHM=ED25519
```

or keep the downloaded PEM file outside committed source and reference it:

```bash
CASPER_MODE=real
CASPER_PRIVATE_KEY_PEM_FILE=.secrets/Account_1_secret_key.pem
CASPER_KEY_ALGORITHM=ED25519
```

Use `CASPER_KEY_ALGORITHM=SECP256K1` when the Casper public key starts with `02`.
Use `CASPER_KEY_ALGORITHM=ED25519` when the Casper public key starts with `01`.

The default RPC URL is:

```text
https://node.testnet.casper.network/rpc
```

The default chain name is:

```text
casper-test
```

## Smoke Test

Mock mode:

```bash
npm --workspace packages/casper run smoke:mock
```

Real-mode preflight:

```bash
npm run casper:preflight
```

This checks:

- `CASPER_MODE=real`
- Signing key can be parsed.
- Public key can be derived without printing the private key.
- RPC node is reachable.
- Account balance is high enough for the configured transfer amount plus payment.

Real testnet mode with a PEM file on macOS/Linux:

```bash
CASPER_MODE=real CASPER_PRIVATE_KEY_PEM_FILE=.secrets/Account_1_secret_key.pem CASPER_KEY_ALGORITHM=SECP256K1 npm --workspace packages/casper run smoke:real
```

Real testnet mode with a PEM file on Windows PowerShell:

```powershell
$env:CASPER_MODE="real"
$env:CASPER_PRIVATE_KEY_PEM_FILE=".secrets/Account_1_secret_key.pem"
$env:CASPER_KEY_ALGORITHM="SECP256K1"
npm --workspace packages/casper run smoke:real
```

After the real smoke test succeeds, copy the returned `transactionHash` and `explorerUrl` into:

- `docs/SUBMISSION.md`
- DoraHacks project page
- demo video narration

## Funding A Testnet Account

1. Create or import a Casper Testnet account.
2. Copy the public key shown by `npm run casper:preflight` or your wallet.
3. Request Testnet CSPR from the official CSPR.live testnet faucet.
4. Wait for the faucet transaction to finalize.
5. Re-run `npm run casper:preflight`.
6. If the balance check passes, run `npm run casper:smoke:real`.

Do not commit `.env`, private keys, seed phrases, or funded account secrets.

## Contract Registry Path

The dedicated Casper contract is designed around these entry points:

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

The current TypeScript integration already includes `toRiskRegistryRecordArgs()` in `packages/casper`, which maps the API's risk credential into the contract's expected arguments. Once Rust/Odra tooling is available, the intended upgrade is:

1. Compile `contracts/risk-registry` to Wasm.
2. Deploy it to Casper Testnet.
3. Add the deployed contract hash to `.env`.
4. Implement a `CasperRegistryAttestationAdapter` that calls `record_credential`.
5. Display both the contract hash and transaction hash in the frontend.

The API currently returns a `registryCall` preview on each report response. This includes the `record_credential` entry point and the exact contract arguments, so the deployed contract adapter can be added without changing the risk-engine output.

## Notes

- A funded Casper Testnet account is required for real mode.
- The native transfer amount defaults to `2500000000` motes.
- The gas payment defaults to `100000000` motes.
- The transaction hash should be included in DoraHacks submission materials.
- Rust/Cargo were not installed in the current Windows workspace, so the registry contract has not been compiled or deployed yet.
