# Finals Verification Guide

## One-Command Check

```bash
npm run verify
```

The command verifies:

- all workspaces build
- shared-domain, Casper-adapter, and API tests pass
- mock Casper attestation is deterministic
- the contract contains both credential and execution-intent entry points
- the frontend contains the published finals contract and transaction evidence
- the API completes report, policy evaluation, idempotent anchor, and registry paths
- caller-supplied policy overrides cannot weaken the server-locked vault policy
- the benchmark contains 30 cases and covers all nine policy checks
- the Rust/Cargo toolchain is visible

## Security Check

```bash
npm audit --audit-level=high
```

Expected result: zero known high or critical package vulnerabilities.

GitHub CI and CodeQL workflows are in `.github/workflows`.

## Manual Product Test

1. Run `npm run dev`.
2. Open `http://127.0.0.1:5173`.
3. Load the sample and run underwriting.
4. Evaluate the default capital action and confirm:
   - decision `Approve`
   - authorization `policy_key`
   - principal cap `$125,000`
   - `9 / 9` checks pass
5. Lower collateral coverage below `1.15x`; confirm `Review` and `reviewer_multisig`.
6. Clear credential verification; confirm `Block`, authorization `none`, and zero principal.
7. Download the audit bundle and confirm it contains the request, report, policy, checks, trace,
   benchmark, and chain evidence.

## Public Casper Readback

```bash
npm run casper:read:registry
npm run casper:read:execution -- --intent-id=intent-09f5ecde
```

These commands query Testnet state without a private key. Expected identifiers:

```text
Contract:
e5c63c54f0c147703548976c174087d4a8e087da191adc2f466fa101e1154a3a

Asset:
invoice:demo-acme-batch

Intent:
intent-09f5ecde

Intent hash:
a22b8596a3648937b165985d94c045a7660e9b1f1bee8fdac414407987e71a6e
```

## Live-Write Safety

The local judge path should use `CASPER_MODE=mock`. Use `CASPER_MODE=real` only when intentionally
submitting a new Testnet write from a funded owner key. Never expose the signing key in the
browser, logs, screenshots, or demo video.
