# Contributing

Thanks for your interest in RWA Credit Sentinel.

## Development Setup

```bash
npm ci
npm run dev
```

The app runs in mock Casper mode by default so contributors can test without private keys or Testnet CSPR.

## Verification

Before opening a pull request, run:

```bash
npm run lint
npm test
npm run build
npm run verify
```

For Casper Testnet review, the public readback command does not require private keys:

```bash
npm run casper:read:registry
```

## Pull Request Guidelines

- Keep changes focused and explain the product impact.
- Do not commit `.env`, `.secrets`, wallet exports, or private keys.
- Update `README.md` and `docs/CASPER.md` if Casper contract hashes, package hashes, or transaction examples change.
- Add or update tests for API, shared logic, Casper argument mapping, or frontend-visible behavior when relevant.

## Project Direction

This project focuses on verifiable RWA credit credentials for DeFi financing gates on Casper Testnet. Useful contributions include:

- Better risk scoring and evaluation datasets.
- Richer Casper registry reads and historical credential versions.
- Safer API validation and clearer judge-facing demo instructions.
- Frontend improvements that make the on-chain proof easier to inspect.
