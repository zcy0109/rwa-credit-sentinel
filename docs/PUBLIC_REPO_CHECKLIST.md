# Public Repository Checklist

Before publishing the repository:

- [ ] Confirm `.env` is not committed.
- [ ] Confirm no Casper private key, API key, wallet seed, or funded account secret appears in the repo.
- [x] Run `npm test`.
- [x] Run `npm run build`.
- [x] Run `npm run verify`.
- [x] Run `npm --workspace packages/casper run smoke:mock`.
- [x] If a funded Casper Testnet key is available, run `npm run casper:preflight`.
- [x] If a funded Casper Testnet key is available, run a real-mode smoke test and record the transaction hash.
- [x] Read the written registry credential back with `npm run casper:read:registry`.
- [x] Update `docs/CASPER.md` with the real contract deployment and registry write hashes.
- [x] Update the DoraHacks submission with the GitHub URL.
- [ ] Upload or link the demo video.
- [x] Include screenshots from `outputs/`.
- [ ] Keep limitations visible: no custody, no investment advice, no real KYC processing.

Recommended pinned artifacts:

- `README.md`
- `docs/SUBMISSION.md`
- `docs/DEMO_SCRIPT.md`
- `docs/CASPER.md`
- Demo screenshot
- Casper Testnet contract deployment and registry write links
