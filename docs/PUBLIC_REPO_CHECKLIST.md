# Public Repository Checklist

Before publishing the repository:

- [ ] Confirm `.env` is not committed.
- [ ] Confirm no Casper private key, API key, wallet seed, or funded account secret appears in the repo.
- [ ] Run `npm test`.
- [ ] Run `npm run build`.
- [ ] Run `npm run verify`.
- [ ] Run `npm --workspace packages/casper run smoke:mock`.
- [x] If a funded Casper Testnet key is available, run `npm run casper:preflight`.
- [x] If a funded Casper Testnet key is available, run a real-mode smoke test and record the transaction hash.
- [x] Update `docs/CASPER.md` with the real transaction hash.
- [x] Update the DoraHacks submission with the GitHub URL.
- [ ] Upload or link the demo video.
- [ ] Include screenshots from `outputs/`.
- [ ] Keep limitations visible: no custody, no investment advice, no real KYC processing.

Recommended pinned artifacts:

- `README.md`
- `docs/SUBMISSION.md`
- `docs/DEMO_SCRIPT.md`
- `docs/CASPER.md`
- Demo screenshot
- Casper Testnet transaction link, once available
