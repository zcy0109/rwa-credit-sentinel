import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import {
  Activity,
  BadgeCheck,
  Ban,
  Blocks,
  Check,
  ChevronRight,
  CircleDollarSign,
  Download,
  ExternalLink,
  FileCheck2,
  Gauge,
  Link2,
  Play,
  RefreshCw,
  Route,
  ShieldCheck,
  SlidersHorizontal,
  TriangleAlert
} from "lucide-react";
import {
  defaultVaultPolicy,
  type AssetType,
  type CasperAttestation,
  type ExecutionContext,
  type ExecutionEvaluation,
  type FinancingRequest,
  type RiskReport
} from "@rwa-sentinel/shared";
import "./styles.css";

const proof = {
  finals: {
    deploymentHash: "694147496b0af6dfe83bf0a32cecd16ae6e09b8a141087f6cc0bcffea0f252c0",
    deploymentUrl: "https://testnet.cspr.live/transaction/694147496b0af6dfe83bf0a32cecd16ae6e09b8a141087f6cc0bcffea0f252c0",
    credentialWriteHash: "2267d02bb600d20d500a6c670bdda5576ef5ab950db04f63302266538a1159d9",
    credentialWriteUrl: "https://testnet.cspr.live/transaction/2267d02bb600d20d500a6c670bdda5576ef5ab950db04f63302266538a1159d9",
    intentWriteHash: "e84e316b075fd257f42e91229cdf7762f8089993b01ea64f5e989303360886f6",
    intentWriteUrl: "https://testnet.cspr.live/transaction/e84e316b075fd257f42e91229cdf7762f8089993b01ea64f5e989303360886f6",
    contractHash: "e5c63c54f0c147703548976c174087d4a8e087da191adc2f466fa101e1154a3a",
    packageHash: "aacf4a08413e873bb3f67b2d7ce78230e3d3e2bde558c2203bd55b1a37853345",
    credentialDictionaryKey: "dictionary-11983ddea2cdd494ee8d074580ff8fec97e7a95b122380ecb44a6dc72f52e860",
    intentDictionaryKey: "dictionary-38a776d306dab1d720019cc91f9734e0a71570e0160affb5a567f50b621f9f96",
    intentId: "intent-09f5ecde",
    intentHash: "a22b8596a3648937b165985d94c045a7660e9b1f1bee8fdac414407987e71a6e"
  },
  qualification: {
    deploymentHash: "735dab5995084abfe4494398ff6f3c6677055a4d5025b79918ae9c4a202a93b9",
    deploymentUrl: "https://testnet.cspr.live/transaction/735dab5995084abfe4494398ff6f3c6677055a4d5025b79918ae9c4a202a93b9",
    recordHash: "096907b2961fe30d01d0267a2876922225d2b43e37f124a40608330e500341f0",
    recordUrl: "https://testnet.cspr.live/transaction/096907b2961fe30d01d0267a2876922225d2b43e37f124a40608330e500341f0",
    contractHash: "aeda10dacdee9cefa8b857c3f6c8a0b2edeb6c19421f16189016ab1a2359b391",
    packageHash: "2765865230aba876704f1b793b2a124adcdf532336c9b455de692ea885637df3"
  }
};

type IntakeForm = Omit<FinancingRequest, "requestedAmountUsd" | "maturityDays" | "publicEvidenceUrls"> & {
  requestedAmountUsd: string;
  maturityDays: string;
  publicEvidenceUrls: string;
};

type ReportResponse = {
  report: RiskReport;
  attestation: CasperAttestation;
  registryCall: {
    contractHash?: string;
    entryPoint: string;
    status: string;
    args: Record<string, string | number>;
  };
  savedAt: string;
};

type ExecutionResponse = {
  evaluation: ExecutionEvaluation;
  credential: CasperAttestation;
  evaluatedAt: string;
  intentHash?: string;
  attestation?: {
    intentId: string;
    intentHash: string;
    network: "casper-testnet" | "mock";
    contractHash?: string;
    entryPoint: "record_execution_intent";
    transactionHash: string;
    explorerUrl?: string;
    createdAt: string;
  };
  anchoredAt?: string;
  idempotent?: boolean;
};

type BenchmarkResponse = {
  sampleCount: number;
  agreementRate: number;
  invalidCredentialBlockRate: number;
  distribution: Record<"approve" | "review" | "block", number>;
  coveredChecks: string[];
};

const sampleForm: IntakeForm = {
  assetName: "Acme Export Invoice Pool",
  assetType: "invoice",
  requestedAmountUsd: "125000",
  maturityDays: "30",
  debtorName: "Acme Manufacturing",
  debtorCountry: "US",
  description: "A recurring invoice pool backed by verified purchase orders, delivery confirmations, and a predictable payment history from an established industrial buyer.",
  publicEvidenceUrls: [
    "https://example.com/invoice-batch",
    "https://example.com/purchase-orders",
    "https://example.com/delivery-records",
    "https://example.com/payment-history"
  ].join("\n")
};

const defaultContext: ExecutionContext = {
  mode: "autonomous",
  collateralRatio: 1.36,
  proposedAdvanceRatePercent: 68,
  liquidityBufferPercent: 31,
  evidenceFreshness: 92,
  credentialVerified: true,
  reportHashVerified: true,
  covenantBreach: false
};

export default function App() {
  const [form, setForm] = useState<IntakeForm>(sampleForm);
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [execution, setExecution] = useState<ExecutionResponse | null>(null);
  const [context, setContext] = useState<ExecutionContext>(defaultContext);
  const [benchmark, setBenchmark] = useState<BenchmarkResponse | null>(null);
  const [loading, setLoading] = useState<"underwrite" | "execute" | "anchor" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/execution/benchmark")
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: BenchmarkResponse | null) => setBenchmark(payload))
      .catch(() => undefined);
  }, []);

  const stage = execution ? 3 : report ? 2 : 1;
  const failedChecks = execution?.evaluation.checks.filter((item) => !item.passed) ?? [];
  const decisionTone = execution?.evaluation.decision ?? "review";
  const canExecute = Boolean(report) && loading === null;

  function updateField(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function buildRequest(): FinancingRequest {
    return {
      ...form,
      requestedAmountUsd: Number(form.requestedAmountUsd),
      maturityDays: Number(form.maturityDays),
      publicEvidenceUrls: form.publicEvidenceUrls.split(/\r?\n/).map((url) => url.trim()).filter(Boolean)
    };
  }

  async function runUnderwriting(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading("underwrite");
    setError(null);
    setExecution(null);
    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildRequest())
      });
      if (!response.ok) throw new Error(await response.text());
      setReport((await response.json()) as ReportResponse);
      requestAnimationFrame(() => document.querySelector("#credential")?.scrollIntoView({ behavior: "smooth" }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Underwriting failed");
    } finally {
      setLoading(null);
    }
  }

  async function evaluateCapitalAction() {
    if (!report) return;
    setLoading("execute");
    setError(null);
    try {
      const response = await fetch("/api/execution/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetId: report.report.assetId, context })
      });
      if (!response.ok) throw new Error(await response.text());
      setExecution((await response.json()) as ExecutionResponse);
      requestAnimationFrame(() => document.querySelector("#decision")?.scrollIntoView({ behavior: "smooth" }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Execution evaluation failed");
    } finally {
      setLoading(null);
    }
  }

  async function anchorExecutionIntent() {
    if (!execution) return;
    setLoading("anchor");
    setError(null);
    try {
      const response = await fetch("/api/execution/anchor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intentId: execution.evaluation.intent.intentId })
      });
      if (!response.ok) throw new Error(await response.text());
      setExecution((await response.json()) as ExecutionResponse);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Execution intent anchoring failed");
    } finally {
      setLoading(null);
    }
  }

  function resetDemo() {
    setForm(sampleForm);
    setContext(defaultContext);
    setReport(null);
    setExecution(null);
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function downloadAuditBundle() {
    if (!report || !execution) return;
    downloadJson(`rwa-audit-${execution.evaluation.intent.intentId}.json`, {
      schemaVersion: "rwa-credit-sentinel-audit/v2",
      generatedAt: new Date().toISOString(),
      riskCredential: report,
      executionRecord: execution,
      verifiedCasperEvidence: proof,
      benchmark
    });
  }

  return (
    <main>
      <header className="app-header">
        <div className="brand-row">
          <div className="brand-mark"><ShieldCheck size={24} /></div>
          <div><strong>RWA Credit Sentinel</strong><span>Finals v2</span></div>
        </div>
        <nav aria-label="Workflow progress">
          <Stage active={stage >= 1} current={stage === 1} number="01" label="Underwrite" />
          <Stage active={stage >= 2} current={stage === 2} number="02" label="Credential" />
          <Stage active={stage >= 3} current={stage === 3} number="03" label="Execute" />
        </nav>
        <button className="icon-button" type="button" title="Reset demo" onClick={resetDemo}><RefreshCw size={18} /></button>
      </header>

      <section className="intro band">
        <div>
          <p className="eyebrow">Casper Agentic Buildathon 2026 · Final Round</p>
          <h1>From verified RWA risk to bounded capital action.</h1>
          <p className="lede">An underwriting agent verifies evidence, anchors a risk credential on Casper, and prepares a policy-constrained lending intent with a complete audit trail.</p>
        </div>
        <div className="intro-metrics">
          <Metric label="Casper network" value="Testnet" />
          <Metric label="Policy checks" value="9" />
          <Metric label="Benchmark" value={benchmark ? `${benchmark.agreementRate}%` : "Loading"} />
        </div>
      </section>

      <section className="chain-proof band dark">
        <div className="section-copy">
          <p className="eyebrow">Verified finals evidence</p>
          <h2>Two real state transitions on Casper</h2>
          <p>The finals contract stores both the underwriting credential and its bounded capital intent. Every link below is independently verifiable on Testnet.</p>
          <a className="qualification-link" href={proof.qualification.deploymentUrl} target="_blank" rel="noreferrer">Qualification contract remains available <ExternalLink size={14} /></a>
        </div>
        <div className="proof-grid">
          <ProofLink label="Finals deploy" hash={proof.finals.deploymentHash} href={proof.finals.deploymentUrl} />
          <ProofLink label="Risk credential" hash={proof.finals.credentialWriteHash} href={proof.finals.credentialWriteUrl} />
          <ProofLink label="Execution intent" hash={proof.finals.intentWriteHash} href={proof.finals.intentWriteUrl} />
          <ProofFact label="Contract" value={proof.finals.contractHash} />
          <ProofFact label="Package" value={proof.finals.packageHash} />
          <ProofFact label="Credential state" value={`record_credential / ${proof.finals.credentialDictionaryKey}`} wide />
          <ProofFact label="Intent state" value={`record_execution_intent / ${proof.finals.intentDictionaryKey}`} wide />
        </div>
      </section>

      {error ? <div className="error-banner"><TriangleAlert size={18} /><span>{error}</span></div> : null}

      <section className="underwrite band" id="underwrite">
        <div className="section-copy sticky-copy">
          <p className="step-label">01 / Underwrite</p>
          <h2>Build the verifiable risk credential</h2>
          <p>Public evidence references remain off-chain. Their digest, the explainable report, and the credit decision become a Casper-verifiable credential.</p>
          <div className="agent-list">
            <span><FileCheck2 size={16} /> Evidence normalization</span>
            <span><Gauge size={16} /> Explainable risk scoring</span>
            <span><Link2 size={16} /> Credential anchoring</span>
          </div>
        </div>
        <form className="form-surface" onSubmit={runUnderwriting}>
          <div className="form-heading"><strong>Financing request</strong><button className="text-button" type="button" onClick={() => setForm(sampleForm)}>Load sample</button></div>
          <div className="form-grid">
            <Field label="Asset name"><input name="assetName" value={form.assetName} onChange={updateField} /></Field>
            <Field label="Asset type"><select name="assetType" value={form.assetType} onChange={updateField}>{(["invoice", "trade_receivable", "real_estate", "commodity", "other"] as AssetType[]).map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}</select></Field>
            <Field label="Requested amount (USD)"><input name="requestedAmountUsd" type="number" min="1" value={form.requestedAmountUsd} onChange={updateField} /></Field>
            <Field label="Maturity (days)"><input name="maturityDays" type="number" min="1" value={form.maturityDays} onChange={updateField} /></Field>
            <Field label="Debtor"><input name="debtorName" value={form.debtorName} onChange={updateField} /></Field>
            <Field label="Country"><input name="debtorCountry" value={form.debtorCountry} onChange={updateField} /></Field>
          </div>
          <Field label="Asset description"><textarea name="description" rows={4} value={form.description} onChange={updateField} /></Field>
          <Field label="Public evidence URLs"><textarea name="publicEvidenceUrls" rows={4} value={form.publicEvidenceUrls} onChange={updateField} /></Field>
          <button className="primary-action" type="submit" disabled={loading !== null}><Play size={18} />{loading === "underwrite" ? "Running underwriting agents…" : "Run underwriting agents"}</button>
        </form>
      </section>

      <section className={`credential band ${report ? "revealed" : "locked"}`} id="credential">
        <div className="section-copy">
          <p className="step-label">02 / Credential</p>
          <h2>Consume evidence, not trust</h2>
          <p>The execution desk only accepts a credential created by this registry workflow. Report and evidence hashes connect the off-chain analysis to Casper state.</p>
        </div>
        {report ? <CredentialView result={report} /> : <LockedState label="Run underwriting to create a credential" />}
      </section>

      <section className={`execution band ${report ? "revealed" : "locked"}`} id="execution">
        <div className="section-copy sticky-copy">
          <p className="step-label">03 / Execute</p>
          <h2>Set the agent's financial boundaries</h2>
          <p>The risk agent proposes. Deterministic vault policy disposes. Private keys stay outside the model, and exceptions route to reviewer multisig.</p>
          <div className="mode-control" aria-label="Execution mode">
            {(["autonomous", "human_in_loop", "simulation"] as const).map((mode) => <button className={context.mode === mode ? "active" : ""} key={mode} type="button" onClick={() => setContext((current) => ({ ...current, mode }))}>{mode.replaceAll("_", " ")}</button>)}
          </div>
        </div>
        {report ? (
          <div className="policy-surface">
            <div className="policy-heading"><SlidersHorizontal size={18} /><strong>Vault policy v1</strong><span>Server locked</span></div>
            <div className="control-grid">
              <NumberControl label="Vault liquidity" value={defaultVaultPolicy.vaultLiquidityUsd} prefix="$" readOnly />
              <NumberControl label="Max single exposure" value={defaultVaultPolicy.maxExposurePercent} suffix="%" readOnly />
              <NumberControl label="Collateral ratio" value={context.collateralRatio} suffix="x" step={0.01} onChange={(value) => setContext((current) => ({ ...current, collateralRatio: value }))} />
              <NumberControl label="Advance rate" value={context.proposedAdvanceRatePercent} suffix="%" onChange={(value) => setContext((current) => ({ ...current, proposedAdvanceRatePercent: value }))} />
              <NumberControl label="Liquidity buffer" value={context.liquidityBufferPercent} suffix="%" onChange={(value) => setContext((current) => ({ ...current, liquidityBufferPercent: value }))} />
              <NumberControl label="Evidence freshness" value={context.evidenceFreshness} suffix="/100" onChange={(value) => setContext((current) => ({ ...current, evidenceFreshness: value }))} />
            </div>
            <div className="switches">
              <Toggle label="Credential verified" checked={context.credentialVerified} onChange={(checked) => setContext((current) => ({ ...current, credentialVerified: checked }))} />
              <Toggle label="Report hash matched" checked={context.reportHashVerified} onChange={(checked) => setContext((current) => ({ ...current, reportHashVerified: checked }))} />
              <Toggle label="Covenant breach" checked={context.covenantBreach} onChange={(checked) => setContext((current) => ({ ...current, covenantBreach: checked }))} danger />
            </div>
            <button className="primary-action" type="button" disabled={!canExecute} onClick={evaluateCapitalAction}><Route size={18} />{loading === "execute" ? "Evaluating policy…" : "Evaluate capital action"}</button>
          </div>
        ) : <LockedState label="A verified credential is required" />}
      </section>

      {execution ? (
        <section className="decision band" id="decision">
          <div className={`decision-summary ${decisionTone}`}>
            <div>
              <p className="step-label">Bounded agent decision</p>
              <h2>{decisionTone === "approve" ? "Approve intent" : decisionTone === "review" ? "Route to review" : "Block execution"}</h2>
              <p>{execution.evaluation.explanation}</p>
            </div>
            <div className="capital-cap"><span>Executable cap</span><strong>${execution.evaluation.principalCapUsd.toLocaleString()}</strong><small>{execution.evaluation.authorization.replaceAll("_", " ")}</small></div>
          </div>

          <div className="decision-grid">
            <section className="decision-pane">
              <div className="pane-heading"><ShieldCheck size={18} /><strong>Policy evidence</strong><span>{9 - failedChecks.length}/9 passed</span></div>
              <div className="check-list">{execution.evaluation.checks.map((item) => <div className={item.passed ? "pass" : "fail"} key={item.id}>{item.passed ? <Check size={16} /> : <Ban size={16} />}<span><strong>{item.label}</strong><small>{item.actual} · requires {item.requirement}</small></span><em>{item.severity}</em></div>)}</div>
            </section>
            <section className="decision-pane">
              <div className="pane-heading"><Activity size={18} /><strong>Agent trace</strong><span>Auditable</span></div>
              <ol className="trace-list">{execution.evaluation.trace.map((item, index) => <li key={item.agent}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{item.agent}</strong><p>{item.summary}</p></div></li>)}</ol>
            </section>
          </div>

          <section className="intent-strip">
            <div><p className="eyebrow">Casper execution intent</p><h2>{execution.evaluation.intent.intentId}</h2><p>{execution.attestation ? "The canonical policy decision is anchored as an auditable execution record." : "Canonical payload ready for a second proof. No funds move in this prototype."}</p></div>
            <dl>
              <dt>Asset</dt><dd>{execution.evaluation.intent.assetId}</dd>
              <dt>Decision</dt><dd>{execution.evaluation.intent.decision}</dd>
              <dt>Authorization</dt><dd>{execution.evaluation.intent.authorization}</dd>
              <dt>Failed checks</dt><dd>{execution.evaluation.intent.failedChecks.join(", ") || "none"}</dd>
              {execution.intentHash ? <><dt>Intent hash</dt><dd><code>{shortHash(execution.intentHash)}</code></dd></> : null}
              {execution.attestation ? <><dt>Proof mode</dt><dd>{execution.attestation.network === "casper-testnet" ? "Casper Testnet" : "Local deterministic adapter"}</dd></> : null}
            </dl>
            <div className="intent-actions">
              {execution.attestation?.explorerUrl ? <a href={execution.attestation.explorerUrl} target="_blank" rel="noreferrer"><ExternalLink size={18} /> View Testnet proof</a> : null}
              <button className="anchor-action" type="button" disabled={Boolean(execution.attestation) || loading !== null} onClick={anchorExecutionIntent}><Link2 size={18} />{execution.attestation ? "Intent anchored" : loading === "anchor" ? "Anchoring…" : "Anchor execution intent"}</button>
              <button type="button" onClick={downloadAuditBundle}><Download size={18} /> Audit bundle</button>
            </div>
          </section>
        </section>
      ) : null}

      <section className="validation band">
        <div className="section-copy"><p className="eyebrow">Evaluation</p><h2>Safety claims backed by repeatable tests</h2><p>The benchmark is deterministic by design: it validates policy behavior, while chain links validate Casper integration.</p></div>
        <div className="validation-grid">
          <Metric label="Cases" value={benchmark ? String(benchmark.sampleCount) : "—"} />
          <Metric label="Decision agreement" value={benchmark ? `${benchmark.agreementRate}%` : "—"} />
          <Metric label="Invalid credentials blocked" value={benchmark ? `${benchmark.invalidCredentialBlockRate}%` : "—"} />
          <Metric label="Policy failure modes" value={benchmark ? String(benchmark.coveredChecks.length) : "—"} />
        </div>
      </section>
    </main>
  );
}

function Stage({ active, current, number, label }: { active: boolean; current: boolean; number: string; label: string }) { return <div className={`${active ? "active" : ""} ${current ? "current" : ""}`}><span>{number}</span><strong>{label}</strong></div>; }
function Metric({ label, value }: { label: string; value: string }) { return <div className="metric"><span>{label}</span><strong>{value}</strong></div>; }
function ProofLink({ label, hash, href }: { label: string; hash: string; href: string }) { return <a className="proof-item" href={href} target="_blank" rel="noreferrer"><span>{label}</span><code>{shortHash(hash)}</code><ExternalLink size={15} /></a>; }
function ProofFact({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) { return <div className={`proof-item ${wide ? "wide" : ""}`}><span>{label}</span><code>{shortHash(value)}</code></div>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="field"><span>{label}</span>{children}</label>; }
function LockedState({ label }: { label: string }) { return <div className="locked-state"><Blocks size={28} /><strong>{label}</strong><span>Complete the preceding workflow step to continue.</span></div>; }

function CredentialView({ result }: { result: ReportResponse }) {
  const isLive = result.attestation.network === "casper-testnet";
  return <div className="credential-surface">
    <div className="score-block"><span>Risk score</span><strong>{result.report.riskScore}</strong><em>{result.report.decision}</em><small>{result.report.confidence}% confidence</small></div>
    <div className="factor-list">{result.report.factors.map((factor) => <div key={factor.id}><span>{factor.label}</span><div><i style={{ width: `${factor.score}%` }} /></div><strong>{factor.score}</strong></div>)}</div>
    <div className="credential-facts"><Fact label="Asset ID" value={result.report.assetId} /><Fact label="Report hash" value={result.report.reportHash} /><Fact label="Evidence hash" value={result.report.evidenceHash} /><Fact label="Entry point" value={result.registryCall.entryPoint} /><Fact label="Current run" value={isLive ? "Casper Testnet" : "Local deterministic adapter"} /><Fact label="Transaction" value={result.attestation.transactionHash} /></div>
    <div className={`run-mode ${isLive ? "live" : "mock"}`}><BadgeCheck size={17} /><span>{isLive ? "This run was written to Casper Testnet." : "This local run is reproducible. Published Testnet proof is shown above."}</span></div>
  </div>;
}

function Fact({ label, value }: { label: string; value: string }) { return <div><span>{label}</span><code>{value}</code></div>; }
function NumberControl({ label, value, prefix = "", suffix = "", step = 1, readOnly = false, onChange }: { label: string; value: number; prefix?: string; suffix?: string; step?: number; readOnly?: boolean; onChange?: (value: number) => void }) { return <label className={`number-control ${readOnly ? "read-only" : ""}`}><span>{label}</span><div>{prefix ? <i>{prefix}</i> : null}<input type="number" step={step} value={value} readOnly={readOnly} aria-readonly={readOnly} onChange={(event) => onChange?.(Number(event.target.value))} />{suffix ? <i>{suffix}</i> : null}</div></label>; }
function Toggle({ label, checked, danger = false, onChange }: { label: string; checked: boolean; danger?: boolean; onChange: (checked: boolean) => void }) { return <label className={`toggle ${danger ? "danger" : ""}`}><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><span>{label}</span></label>; }
function shortHash(value: string) { return value.length > 32 ? `${value.slice(0, 14)}…${value.slice(-10)}` : value; }
function downloadJson(filename: string, payload: unknown) { const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })); const anchor = document.createElement("a"); anchor.href = url; anchor.download = filename; anchor.click(); URL.revokeObjectURL(url); }
