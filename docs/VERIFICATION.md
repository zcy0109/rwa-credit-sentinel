# Verification Guide

Run the full local verification suite:

```bash
npm run verify
```

This command checks:

- All workspace builds.
- Shared, Casper, and API tests.
- Casper mock attestation smoke test.
- Risk Registry contract source files and expected entry points.
- Built frontend bundle includes the Casper registry path panel, contract deployment hash, registry write hash, and contract hash.
- API health, report generation, contract-call preview generation, and credential registry persistence.
- Rust/Cargo availability as a warning-only check.

## Expected Result

The command should end with a summary like:

```text
Verification summary:
- PASS: Build all workspaces
- PASS: Run automated tests
- PASS: Run Casper mock smoke
- PASS: Check Risk Registry contract source
- PASS: Check built frontend includes registry path
- PASS: Exercise API report and credential registry
- WARN: Check Rust/Cargo availability
```

The Rust/Cargo warning is expected on machines without the Casper contract toolchain. It does not block local TypeScript verification. The submitted build already includes a compiled/deployed Testnet contract and a real registry write.

## Real Casper Testnet Check

After creating and funding a Casper Testnet account, run:

```bash
npm run casper:preflight
npm run casper:smoke:real
```

`casper:preflight` should pass before submitting a real smoke transaction. It confirms the signing key is readable, the public key is derived, the RPC node responds, and the account has enough motes for the configured contract call payment.

The verified registry write is:

```text
https://testnet.cspr.live/transaction/096907b2961fe30d01d0267a2876922225d2b43e37f124a40608330e500341f0
```

The already-written credential can be read back without a private key:

```bash
npm run casper:read:registry
```
