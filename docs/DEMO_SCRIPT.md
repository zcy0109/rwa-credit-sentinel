# Finals Demo Script

Target length: 4 minutes.

## 0:00-0:25 - Problem and Product

### Screen

Show the first viewport with the project name, one-sentence workflow, and benchmark metrics.

### English narration

RWA lending agents should not receive an opaque risk score and unrestricted access to capital.
RWA Credit Sentinel turns public evidence into a verifiable risk credential, evaluates it against
explicit vault policy, and prepares a bounded execution intent with a complete audit trail.

## 0:25-0:55 - Real Casper Proof

### Screen

Scroll to **Two real state transitions on Casper**. Point to:

- Finals contract deployment and package hash
- `record_credential` transaction
- `record_execution_intent` transaction
- Both dictionary keys

Select **Verify live contract state**. Show `5/5` credential checks, `8/8` execution-intent
checks, the `$125,000` principal ceiling, and the returned state-root hash. Optionally open the
execution-intent transaction in CSPR.live and show `Status: Success`, then return.

### English narration

This is not a front-end-only demo. The finals registry contract is deployed on Casper Testnet.
One successful call stores the underwriting credential. A second call stores the policy decision,
authorization, principal cap, and canonical intent hash. The verification button reads both
contract dictionaries from Casper RPC and checks thirteen expected fields live.

## 0:55-1:35 - Underwriting Agents

### Screen

Point briefly to **Add evidence files**, which accepts bounded JSON, CSV, TXT, or PDF input. Then
select **Load sample**, point to the explicitly synthetic four-document evidence pack, and select
**Run underwriting agents**. Show each document hash, the manifest hash, score, factor bars,
report hash, evidence hash, agent tools, and the bounded-runtime provenance panel.

### English narration

The evidence intake accepts bounded files and recomputes their hashes on the server. Hashing proves
content integrity, not the truth of a commercial claim. The first four agents normalize the
invoice request, score explainable factors, bind document hashes into a canonical manifest, and
issue a structured credential. The visible provenance record identifies each tool and confirms
that decision authority remains with server policy and private keys remain unavailable.

## 1:35-2:35 - Bounded Execution

### Screen

Keep **Autonomous** mode and default values. Select **Evaluate capital action**. Show:

- Approve intent
- `$125,000` executable cap
- `policy_key` authorization
- `9 / 9` policy checks
- Four-step execution trace

Then lower collateral coverage below `1.15x` and evaluate again. Show **Route to review** and
`reviewer_multisig`. Finally clear **Credential verified**, evaluate, and show **Block execution**.

### English narration

The next four agents verify the credential, evaluate nine deterministic boundaries, compute a
risk-adjusted capital cap, and assign authority. The model cannot override these controls. A clean
case receives policy-key authorization. A soft exception routes to reviewer multisig. An invalid
credential receives no authority and is blocked.

## 2:35-3:10 - Execution Intent and Decision Receipt

### Screen

Restore the default sample and approve it. Show the intent ID, asset, decision, authorization,
failed checks, and intent hash. Point to **Anchor execution intent**, but do not submit a new live
transaction during recording. Open the published Testnet proof instead. Select
**Decision receipt**.

### English narration

The server stores the evaluated intent before anchoring, recomputes its canonical hash, and signs
outside the agent loop. Repeated requests are idempotent. The server-generated receipt contains
the evidence integrity boundary, agent provenance, policy snapshot, every check, current-run
evidence, published Casper evidence, limitations, and its own receipt hash.

## 3:10-3:35 - Independent Chain Readback

### Screen

The in-app verification already proved live state. For a second independent path, briefly run:

```powershell
npm run casper:read:registry
npm run casper:read:execution -- --intent-id=intent-b781ee81
```

Show the matching asset, report hash, decision, authorization, principal cap, intent hash, and
dictionary keys.

### English narration

The same state can be reproduced from the command line without a private key. The UI and CLI use
the same tested state-reader module, proving the records are contract state rather than decorative
transaction links.

## 3:35-4:00 - Evaluation and Close

### Screen

Return to the benchmark band. Show 30 cases, decision agreement, invalid-credential block rate,
and nine covered policy failure modes.

### English narration

The 30-case deterministic benchmark covers every policy boundary and verifies expected
approve, review, and block behavior. It does not claim predictive model accuracy. The product's
contribution is accountable autonomy: verifiable inputs, explicit authority, bounded capital, and
Casper-backed execution evidence.

## Recording Notes

- Record at 1080p and 30 fps.
- Keep the browser at 100 percent zoom.
- Do not show `.env`, wallet secrets, or private-key files.
- Say "content-hashed synthetic evidence pack", not "uploaded private contracts".
- Say "Wasm" as one word.
- Keep the final video between 3:40 and 4:20.
