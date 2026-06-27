# Verification Guide

Run the full local verification suite:

```bash
npm run verify
```

This command checks:

- All workspace builds.
- Shared, Casper, and API tests.
- Casper mock attestation smoke test.
- Risk Registry contract blueprint files and expected entry points.
- Built frontend bundle includes the Casper registry path panel.
- API health, report generation, contract-call preview generation, and credential registry persistence.
- Rust/Cargo availability as a warning-only check.

## Expected Result

The command should end with a summary like:

```text
Verification summary:
- PASS: Build all workspaces
- PASS: Run automated tests
- PASS: Run Casper mock smoke
- PASS: Check Risk Registry contract blueprint
- PASS: Check built frontend includes registry path
- PASS: Exercise API report and credential registry
- WARN: Check Rust/Cargo availability
```

The Rust/Cargo warning is expected on machines without the Casper/Odra contract toolchain. It does not block the TypeScript prototype, but it does mean the `contracts/risk-registry` blueprint has not been compiled to Wasm locally.

## Real Casper Testnet Check

After creating and funding a Casper Testnet account, run:

```bash
npm run casper:preflight
npm run casper:smoke:real
```

`casper:preflight` should pass before submitting a real smoke transaction. It confirms the signing key is readable, the public key is derived, the RPC node responds, and the account has enough motes for the configured transfer plus payment.
