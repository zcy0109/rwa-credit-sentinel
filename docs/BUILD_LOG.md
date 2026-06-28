# Build Log

## 2026-06-26 23:33 CST

- Created active project goal in Codex for end-to-end RWA Credit Sentinel delivery.
- Added thread heartbeat automation for overnight continuation passes after the user's daily quota refresh windows.
- Confirmed workspace is projectless and clean.
- Confirmed local tooling: Node.js v24.12.0, npm 11.6.2, Git 2.49.0.
- Started durable project planning artifacts under `work/rwa-credit-sentinel`.

## Next

- Scaffold the monorepo.
- Create the API risk pipeline first, because it defines the product contract for the frontend and Casper module.

## 2026-06-26 23:40 CST

- Created npm workspace monorepo with `apps/api`, `apps/web`, `packages/shared`, and `packages/casper`.
- Implemented first-pass shared domain types, DeFi financing gate logic, mock Casper attestation adapter, API service, risk-agent pipeline, and Vite React demo UI.
- `npm run build` passes across shared, Casper, API, and web packages.
- First test run failed because `packages/shared` did not yet include tests; added shared financing gate tests next.

## 2026-06-26 23:42 CST

- Added shared financing gate tests.
- `npm test` passes: shared package 3 tests, API package 1 test.
- `npm run build` passes after tests.

## Current Limitations

- Casper integration is currently a deterministic mock adapter. Real Casper Testnet transaction/contract work remains the highest-risk qualification task.
- AI agent output is currently deterministic scoring logic, not yet connected to an LLM provider. This is intentional until the product flow is stable and API keys are available.

## 2026-06-26 23:45 CST

- Started local dev server.
- Verified API health endpoint and Vite frontend respond locally.
- Browser check found React was not mounted because `index.html` pointed directly at `App.tsx`.
- Added `src/main.tsx` with `ReactDOM.createRoot` and updated `index.html`.

## 2026-06-26 23:47 CST

- Re-ran `npm test`: shared and API tests pass.
- Re-ran `npm run build`: all workspaces build successfully.
- Verified frontend in the in-app browser at `http://127.0.0.1:5173`.
- Clicked the demo assessment button and confirmed the page renders:
  - Risk score and review decision.
  - Agent Trace.
  - Risk Factors.
  - Casper Credential with mock transaction hash.
- Saved screenshot to `outputs/rwa-credit-sentinel-demo.png`.

## Highest Priority Next

1. Replace mock Casper adapter with a real Casper Testnet path or a deployable contract plan.
2. Improve the frontend from fixed sample demo to editable RWA intake form.
3. Strengthen the agent pipeline so it presents credible multi-agent reasoning and evidence.

## 2026-06-26 23:58 CST

- Installed official `casper-js-sdk` and implemented a real-mode Casper adapter.
- Real-mode strategy: send a Casper Testnet native self-transfer and derive the transfer ID from the report hash as an on-chain memo.
- Added `.env.example`, `docs/CASPER.md`, and Casper smoke script.
- API now selects Casper adapter from environment via `createCasperAdapterFromEnv`.
- Frontend now displays attestation method, transfer ID, transaction hash, and explorer link when present.
- Upgraded frontend from fixed sample button to editable RWA financing intake form.
- Added full README, DoraHacks submission draft, and demo video script.
- Verified editable browser flow and saved screenshot to `outputs/rwa-credit-sentinel-editable-demo.png`.
- Added public repository checklist for GitHub/DoraHacks readiness.

## Remaining Qualification Risk

- A real Casper Testnet transaction has not been submitted because no funded Casper Testnet private key is present in the workspace.
- The current real-mode transaction is a native transfer memo anchor. It is acceptable as a transaction-producing Casper component for qualification, but the final-round upgrade should be an Odra/Rust report registry contract.

## 2026-06-27 00:08 CST

- Refactored API into `createApp()` for automated HTTP testing.
- Added local credential registry service with:
  - `GET /api/credentials`
  - `GET /api/credentials/:assetId`
  - registry persistence for the current API process.
- Added API test coverage for report creation, credential listing, and single credential retrieval.
- Added frontend recent credential registry panel.
- Verified browser flow: editable form submits, result renders, and registry row appears.
- Saved screenshot to `outputs/rwa-credit-sentinel-registry-demo.png`.

## 2026-06-27 00:15 CST

- Added `contracts/risk-registry` Casper contract blueprint using an Odra/Rust-style module:
  - `record_credential`
  - `get_credential`
  - `owner`
- Added `packages/casper/src/registryContract.ts` to map current risk credentials into future contract call arguments.
- Added Casper package test coverage for registry argument mapping.
- Updated README, Casper docs, DoraHacks submission draft, demo script, TODO, and acceptance checklist.
- `npm run build` passes.
- `npm test` passes:
  - shared package: 3 tests
  - Casper package: 1 test
  - API package: 3 tests
- `npm --workspace packages/casper run smoke:mock` passes.
- `cargo check` could not run because Cargo/Rust are not installed in this Windows workspace.

## Current Chain Status

- Qualification path: real Casper Testnet native-transfer attestation is implemented and needs a funded testnet key to produce a real transaction hash.
- Final-round path: Casper Risk Registry contract is scaffolded but not compiled or deployed yet.

## 2026-06-27 00:18 CST

- Added a frontend `Casper Registry Path` panel to connect the current attestation method with the future `record_credential` contract call.
- Re-ran `npm run build`: passes.
- Re-ran `npm test`: passes.
- Started local dev server and verified:
  - API health endpoint returns `ok`.
  - Vite frontend returns HTTP 200.
  - `POST /api/reports` returns asset ID, score, decision, transaction hash, report hash, and evidence hash.
  - Built frontend bundle contains `Casper Registry Path` and `record_credential`.
- Re-ran Casper mock smoke test: passes.

## 2026-06-27 00:25 CST

- Added `npm run verify` as a one-command judge/developer verification flow.
- Verification now checks:
  - workspace build
  - shared, Casper, and API tests
  - Casper mock smoke attestation
  - Risk Registry contract blueprint entry points
  - built frontend registry path panel
  - API health, report generation, registry-call preview, and credential registry persistence
  - Rust/Cargo availability as a warning-only check
- Added `docs/VERIFICATION.md`.
- Added `registryCall` preview to every report response:
  - `entryPoint: record_credential`
  - `status: ready-for-contract-call`
  - exact contract arguments for asset ID, risk score, decision, report hash, evidence hash, and timestamp
- Updated frontend to show the registry call preview next to the Casper credential.
- Updated README, Casper docs, and submission draft to describe the contract-call preview.
- `npm run verify` passes with one expected warning: Cargo/Rust are not installed in the current Windows workspace.

## 2026-06-27 09:51 CST

- Confirmed there is no project-specific Codex skill; continuation is driven by the active goal, build log, TODO, and verification scripts.
- Added Casper real-mode preflight tooling:
  - root script: `npm run casper:preflight`
  - package script: `npm --workspace packages/casper run preflight:real`
  - checks `CASPER_MODE=real`, signing key parsing, public key derivation, RPC status, and funded balance.
- Added `npm run casper:smoke:real` root shortcut.
- Updated `.env.example` with `CASPER_RISK_REGISTRY_HASH`.
- Updated README, Casper docs, verification guide, public repo checklist, and submission draft with the preflight workflow.
- Ran `npm run casper:preflight` without real-mode env; it fails clearly as expected with `CASPER_MODE must be set to real`.
- Fixed SDK type usage in the preflight balance query.
- Re-ran `npm run verify`: passes with the existing warning that Cargo/Rust are not installed.

## 2026-06-27 14:09 CST

- Confirmed user-funded Casper Testnet account has 5000 Testnet CSPR via public balance query.
- Faucet funding transaction provided by user:
  - `2feb7624ddb471bff97af0c8df1d27d689ca3fe20a06f3e94361dae24c60fa9a`
- Fixed Casper preflight balance query to use `PurseIdentifier.fromPublicKey(...)`, matching the actual `casper-js-sdk` runtime API.
- Re-ran `npm run verify`: passes with the existing warning that Cargo/Rust are not installed.
- Next required action: user must add the private key locally to `.env`; do not paste it into chat.

## 2026-06-27 14:25 CST

- Added `.secrets` to `.gitignore`.
- Added support for `CASPER_PRIVATE_KEY_PEM_FILE`, allowing local PEM key files without pasting private keys into chat or `.env` inline.
- Created local `.env` pointing to `.secrets/Account 1_secret_key.pem`.
- Switched `CASPER_KEY_ALGORITHM` to `SECP256K1` because the account public key starts with `02`.
- Real-mode preflight passes:
  - public key: `0202a88b97ebb35fc1a2352d24ab37347fe5d909561cf41ba9f1af9c1d84e1bcd5db`
  - node API version: `2.0.0`
  - balance sufficient
- Submitted real Casper Testnet native-transfer attestation:
  - transaction hash: `34e2e8d36239d4f96dc2d5e38337a1834c6289ebbfc4ca24e99619ccfc6d1b65`
  - explorer: `https://testnet.cspr.live/transaction/34e2e8d36239d4f96dc2d5e38337a1834c6289ebbfc4ca24e99619ccfc6d1b65`
  - transfer ID: `175750564669954`
  - block height: `8315213`
  - block hash: `ca56cb75fa821eabe1aa69fd9f5578c1663a7c720ae08751ee7579afb3ce3a28`
- Fixed transaction hash extraction from `casper-js-sdk` RPC response.
- Forced `smoke:mock` to override `.env` real mode so `npm run verify` cannot accidentally spend Testnet CSPR.
- Re-ran `npm run verify`: passes with the existing warning that Cargo/Rust are not installed.

## 2026-06-27 14:33 CST

- Initialized Git repository and created initial commit:
  - `c59b921 Initial RWA Credit Sentinel buildathon prototype`
- Confirmed `.env` and `.secrets/` are ignored and not staged.
- Created GitHub repository:
  - `https://github.com/zcy0109/rwa-credit-sentinel`
- Pushed `main` to GitHub.
- Confirmed repository page returns HTTP 200.

## 2026-06-27 14:55 CST

- Added a first-screen Casper proof strip to the frontend with:
  - real Testnet transaction hash
  - block height
  - transfer ID
  - explorer link
- Updated README with a judge quickstart and submission snapshot.
- Updated DoraHacks submission notes, demo script, acceptance checklist, and TODOs to reflect the published repository and real Casper evidence.
- Improved real-mode documentation to prefer ignored wallet PEM files instead of pasting private keys.
- Extended `npm run verify` to require the frontend's real Casper proof strip and transaction hash in the production bundle.
- Re-ran `npm run verify`: passes with the existing warning that Cargo/Rust are not installed.

## 2026-06-27 15:08 CST

- Clarified the frontend distinction between:
  - published real Casper Testnet proof from the verified buildathon smoke run
  - repeatable local mock credentials generated by the default web demo
- Added a mode badge and explanatory state to the Casper Credential panel.
- Updated the contract path panel and local registry label so mock data is not presented as the same object as the published Testnet transaction.

## 2026-06-28 10:22 CST

- Compiled and deployed the native Casper Risk Registry contract to Testnet.
- Deployment transaction:
  - `735dab5995084abfe4494398ff6f3c6677055a4d5025b79918ae9c4a202a93b9`
  - `https://testnet.cspr.live/transaction/735dab5995084abfe4494398ff6f3c6677055a4d5025b79918ae9c4a202a93b9`
- Deployed contract hash:
  - `aeda10dacdee9cefa8b857c3f6c8a0b2edeb6c19421f16189016ab1a2359b391`
- Deployed package hash:
  - `2765865230aba876704f1b793b2a124adcdf532336c9b455de692ea885637df3`
- Implemented `CasperRegistryAttestationAdapter` in `packages/casper`.
- Submitted a real `record_credential` registry write:
  - `096907b2961fe30d01d0267a2876922225d2b43e37f124a40608330e500341f0`
  - `https://testnet.cspr.live/transaction/096907b2961fe30d01d0267a2876922225d2b43e37f124a40608330e500341f0`
- Updated frontend proof strip to show:
  - contract deployment
  - registry write
  - contract hash
  - entry point
- Updated the Casper credential panel so contract-registry mode shows `Contract Hash` and `Entry Point` instead of transfer-only fields.
- Re-ran `npm run build` and `npm test`: both passed.

## 2026-06-28 10:45 CST

- Rewrote README for submission state: real contract deployment and real registry write are now first-screen evidence.
- Updated DoraHacks submission draft, Casper docs, demo script, verification guide, acceptance checklist, TODO, and public repository checklist.
- Updated `npm run verify` to validate the current deployed contract proof instead of the older native-transfer proof.
- Added `npm run casper:read:registry`, a no-private-key readback script that:
  - resolves the deployed contract's `records` dictionary URef from Casper RPC
  - queries `invoice:demo-acme-batch`
  - confirms the stored credential fields match the verified registry write
