# Threat Model

## Protected Assets

- Casper owner signing key
- vault authorization decisions
- report, evidence, and execution-intent integrity
- policy thresholds and principal caps
- replay and duplicate-write safety
- availability of public verification

## Trust Boundaries

1. **Browser to API**: all request and execution-context fields are untrusted.
2. **Agent workflow to policy engine**: agent outputs are proposals, not authority.
3. **Policy engine to signer**: only a saved canonical intent may reach the signer.
4. **Signer to Casper RPC**: the server signs a bounded contract call; keys never enter browser or
   model context.
5. **Casper state to verifier**: public readers verify contract dictionaries and hashes without a
   private key.

## Main Threats and Controls

| Threat | Control |
| --- | --- |
| Caller weakens vault limits | API ignores caller policy objects and applies server-locked policy v1 |
| Model invents authorization | Authorization is computed by deterministic code from nine checks |
| Invalid credential reaches execution | Credential and exact report-hash checks are hard blockers |
| Excessive single-asset exposure | Server policy caps exposure and computes a risk-adjusted principal ceiling |
| Private key exposure | Signing remains server-side; secrets are gitignored and excluded from logs/UI |
| Payload substitution before signing | Anchor endpoint accepts only `intentId`, retrieves the stored intent, and recomputes its canonical hash |
| Duplicate anchor request | Saved attestations make anchor requests idempotent |
| Stale or weak evidence | Evidence freshness is a policy check; report/evidence hashes are stored in the credential |
| Uploaded evidence exhausts API memory | Six-file, 1 MB per-file, and 4 MB bundle limits are enforced before registration |
| Content hash is mistaken for truth | UI and decision receipt state that hashing proves integrity, not commercial claim validity |
| Decision receipt is modified | The server hashes the complete generated receipt and includes its `receiptHash` |
| Unresolved covenant breach | Active breach is a hard blocker with zero authority and zero principal |
| Soft exception auto-executes | Soft failures route to `reviewer_multisig`, never `policy_key` |

## Residual Risks

- The deterministic score is a prototype and is not validated against real loan-loss outcomes.
- Public URLs do not prove the truth of their source data; production requires trusted provenance
  or oracle infrastructure.
- User-submitted files are held only in API memory for the current process. The demo stores the
  manifest, not a durable evidence archive.
- The in-memory API registry is for demonstration; production requires durable storage and
  concurrency controls.
- Owner-key authorization is intentionally simple; production requires HSM-backed keys,
  rotation, role separation, and multisig governance.
- The contract records decisions but does not settle principal. Any settlement contract requires
  separate design, audit, and legal review.

## Security Invariants

- A hard failure always produces `block`, `none`, and zero principal.
- A soft exception never receives autonomous policy-key authorization.
- The browser cannot provide the policy used by the signer.
- The same canonical intent cannot produce different local hashes.
- Public readback must reproduce the identifiers shown in the submission.
