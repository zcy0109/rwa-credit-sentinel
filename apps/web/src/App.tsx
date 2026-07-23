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
  FileUp,
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
  finalsEvidence,
  qualificationEvidence,
  SAMPLE_EVIDENCE_BUNDLE_ID,
  testnetTransactionUrl,
  type AssetType,
  type CasperAttestation,
  type ExecutionContext,
  type ExecutionEvaluation,
  type EvidenceManifest,
  type FinancingRequest,
  type RiskReport
} from "@rwa-sentinel/shared";
import "./styles.css";

const proof = {
  finals: {
    ...finalsEvidence,
    deploymentUrl: testnetTransactionUrl(finalsEvidence.deploymentHash),
    credentialWriteUrl: testnetTransactionUrl(finalsEvidence.credentialWriteHash),
    intentWriteUrl: testnetTransactionUrl(finalsEvidence.intentWriteHash)
  },
  qualification: {
    ...qualificationEvidence,
    deploymentUrl: testnetTransactionUrl(qualificationEvidence.deploymentHash),
    recordUrl: testnetTransactionUrl(qualificationEvidence.recordHash)
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

type ChainVerificationResponse = {
  verified: boolean;
  verifiedAt: string;
  contractHash: string;
  packageHash: string;
  credential: {
    dictionaryKey: string;
    stateRootHash: string;
    record: {
      asset_id: string;
      risk_score: number;
      decision: string;
      report_hash: string;
      evidence_hash: string;
    };
    checks: Array<{ id: string; label: string; passed: boolean; expected: string; actual: string }>;
  };
  executionIntent: {
    dictionaryKey: string;
    stateRootHash: string;
    record: {
      intent_id: string;
      decision: string;
      authorization: string;
      principal_cap_usd: number;
      intent_hash: string;
    };
    checks: Array<{ id: string; label: string; passed: boolean; expected: string; actual: string }>;
  };
};

type EvidenceIntakeResponse = {
  manifest: EvidenceManifest;
  extraction: Array<{
    documentId: string;
    format: string;
    recordCount?: number;
    fieldNames?: string[];
  }>;
  integrityStatement: string;
  claimVerification: "not-performed";
};

const sampleForm: IntakeForm = {
  assetName: "Acme Export Invoice Pool Finals",
  assetType: "invoice",
  requestedAmountUsd: "125000",
  maturityDays: "30",
  debtorName: "Acme Manufacturing",
  debtorCountry: "US",
  description: "A recurring invoice pool backed by verified purchase orders, delivery confirmations, and a predictable payment history from an established industrial buyer.",
  evidenceBundleId: SAMPLE_EVIDENCE_BUNDLE_ID,
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
  const [chainVerification, setChainVerification] = useState<ChainVerificationResponse | null>(null);
  const [uploadedEvidence, setUploadedEvidence] = useState<EvidenceIntakeResponse | null>(null);
  const [uploadingEvidence, setUploadingEvidence] = useState(false);
  const [verifyingChain, setVerifyingChain] = useState(false);
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
    setReport(null);
    setExecution(null);
  }

  function loadSample() {
    setForm(sampleForm);
    setUploadedEvidence(null);
    setReport(null);
    setExecution(null);
    setError(null);
  }

  async function ingestEvidence(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;

    setUploadingEvidence(true);
    setError(null);
    setReport(null);
    setExecution(null);
    try {
      const encodedFiles = await Promise.all(
        files.map(async (file) => {
          if (file.size > 1_000_000) {
            throw new Error(`${file.name} exceeds the 1 MB evidence limit.`);
          }
          return {
            name: file.name,
            mediaType: supportedMediaType(file),
            evidenceType: inferEvidenceType(file.name),
            contentBase64: bytesToBase64(await file.arrayBuffer())
          };
        })
      );
      const response = await fetch("/api/evidence/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: `${form.assetName || "RWA"} submitted evidence`,
          files: encodedFiles
        })
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(payload?.error ?? "Evidence intake failed.");
      }
      const bundle = await response.json() as EvidenceIntakeResponse;
      setUploadedEvidence(bundle);
      setForm((current) => ({ ...current, evidenceBundleId: bundle.manifest.bundleId }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Evidence intake failed");
    } finally {
      setUploadingEvidence(false);
    }
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

  async function verifyLiveContractState() {
    setVerifyingChain(true);
    setError(null);
    try {
      const response = await fetch("/api/casper/verify-finals");
      if (!response.ok) throw new Error("Casper RPC readback is temporarily unavailable.");
      setChainVerification((await response.json()) as ChainVerificationResponse);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Casper state verification failed");
    } finally {
      setVerifyingChain(false);
    }
  }

  function resetDemo() {
    setForm(sampleForm);
    setContext(defaultContext);
    setReport(null);
    setExecution(null);
    setUploadedEvidence(null);
    setChainVerification(null);
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function downloadDecisionReceipt() {
    if (!report || !execution) return;
    setError(null);
    const anchor = document.createElement("a");
    anchor.href = `/api/execution/receipts/${encodeURIComponent(execution.evaluation.intent.intentId)}?download=1`;
    anchor.download = `rwa-decision-receipt-${execution.evaluation.intent.intentId}.json`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
  }

  return (
    <main>
      <header className="app-header">
        <div className="brand-row">
          <div className="brand-mark"><ShieldCheck size={24} /></div>
          <div><strong>RWA Credit Sentinel</strong><span>Finals v3</span></div>
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
        <div className="proof-column">
          <div className="proof-grid">
            <ProofLink label="Finals deploy" hash={proof.finals.deploymentHash} href={proof.finals.deploymentUrl} />
            <ProofLink label="Risk credential" hash={proof.finals.credentialWriteHash} href={proof.finals.credentialWriteUrl} />
            <ProofLink label="Execution intent" hash={proof.finals.intentWriteHash} href={proof.finals.intentWriteUrl} />
            <ProofFact label="Contract" value={proof.finals.contractHash} />
            <ProofFact label="Package" value={proof.finals.packageHash} />
            <ProofFact label="Credential state" value={`record_credential / ${proof.finals.credentialDictionaryKey}`} wide />
            <ProofFact label="Intent state" value={`record_execution_intent / ${proof.finals.intentDictionaryKey}`} wide />
          </div>
          <button className="verify-state-action" type="button" disabled={verifyingChain} onClick={verifyLiveContractState}>
            <RefreshCw className={verifyingChain ? "spinning" : ""} size={17} />
            {verifyingChain ? "Reading Casper contract state…" : "Verify live contract state"}
          </button>
          {chainVerification ? <ChainVerificationPanel result={chainVerification} /> : (
            <p className="verification-hint">One click reads both dictionaries from Casper RPC and compares 13 fields with the published finals evidence.</p>
          )}
        </div>
      </section>

      {error ? <div className="error-banner"><TriangleAlert size={18} /><span>{error}</span></div> : null}

      <section className="underwrite band" id="underwrite">
        <div className="section-copy sticky-copy">
          <p className="step-label">01 / Underwrite</p>
          <h2>Build the verifiable risk credential</h2>
          <p>Evidence remains off-chain. Content hashes, the explainable report, and the credit decision become a Casper-verifiable credential.</p>
          <div className="agent-list">
            <span><FileCheck2 size={16} /> Evidence normalization</span>
            <span><Gauge size={16} /> Explainable risk scoring</span>
            <span><Link2 size={16} /> Credential anchoring</span>
          </div>
        </div>
        <form className="form-surface" onSubmit={runUnderwriting}>
          <div className="form-heading"><strong>Financing request</strong><button className="text-button" type="button" onClick={loadSample}>Load sample</button></div>
          <div className="form-grid">
            <Field label="Asset name"><input name="assetName" value={form.assetName} onChange={updateField} /></Field>
            <Field label="Asset type"><select name="assetType" value={form.assetType} onChange={updateField}>{(["invoice", "trade_receivable", "real_estate", "commodity", "other"] as AssetType[]).map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}</select></Field>
            <Field label="Requested amount (USD)"><input name="requestedAmountUsd" type="number" min="1" value={form.requestedAmountUsd} onChange={updateField} /></Field>
            <Field label="Maturity (days)"><input name="maturityDays" type="number" min="1" value={form.maturityDays} onChange={updateField} /></Field>
            <Field label="Debtor"><input name="debtorName" value={form.debtorName} onChange={updateField} /></Field>
            <Field label="Country"><input name="debtorCountry" value={form.debtorCountry} onChange={updateField} /></Field>
          </div>
          <Field label="Asset description"><textarea name="description" rows={4} value={form.description} onChange={updateField} /></Field>
          {form.evidenceBundleId === SAMPLE_EVIDENCE_BUNDLE_ID ? <div className="evidence-package-banner">
            <FileCheck2 size={20} />
            <div><strong>Content-hashed synthetic evidence pack</strong><span>4 documents / invoice register, purchase orders, deliveries, and payment history</span></div>
            <a href="/api/evidence/sample" target="_blank" rel="noreferrer">Inspect JSON <ExternalLink size={14} /></a>
          </div> : null}
          <div className="evidence-intake">
            <div>
              <FileUp size={20} />
              <span><strong>Evidence intake</strong><small>JSON, CSV, TXT or PDF / 1 MB each / 6 files maximum</small></span>
            </div>
            <label className="upload-action">
              <FileUp size={16} />
              {uploadingEvidence ? "Hashing evidence..." : "Add evidence files"}
              <input
                type="file"
                accept=".json,.csv,.txt,.pdf,application/json,text/csv,text/plain,application/pdf"
                multiple
                disabled={uploadingEvidence}
                onChange={ingestEvidence}
              />
            </label>
          </div>
          {uploadedEvidence ? <div className="uploaded-evidence">
              <div><BadgeCheck size={18} /><span><strong>{uploadedEvidence.manifest.documentCount} {uploadedEvidence.manifest.documentCount === 1 ? "file" : "files"} hashed server-side</strong><small>Commercial claims remain unverified</small></span><code>{shortHash(uploadedEvidence.manifest.manifestHash)}</code></div>
            <div>{uploadedEvidence.manifest.documents.map((document) => <span key={document.id}><strong>{document.title}</strong><code>{shortHash(document.sha256)}</code></span>)}</div>
          </div> : null}
          <Field label="Public reference URLs (optional)"><textarea name="publicEvidenceUrls" rows={4} value={form.publicEvidenceUrls} onChange={updateField} /></Field>
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
              <button type="button" disabled={loading !== null} onClick={downloadDecisionReceipt}><Download size={18} />Decision receipt</button>
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
function ChainVerificationPanel({ result }: { result: ChainVerificationResponse }) {
  const credentialPassed = result.credential.checks.filter((item) => item.passed).length;
  const intentPassed = result.executionIntent.checks.filter((item) => item.passed).length;
  return <div className={`chain-verification ${result.verified ? "verified" : "mismatch"}`}>
    <div className="verification-title">
      {result.verified ? <BadgeCheck size={20} /> : <TriangleAlert size={20} />}
      <div><strong>{result.verified ? "Verified live from contract state" : "Published evidence mismatch"}</strong><span>{new Date(result.verifiedAt).toLocaleString()}</span></div>
    </div>
    <div className="verification-counts">
      <span>Risk credential <strong>{credentialPassed}/{result.credential.checks.length}</strong></span>
      <span>Execution intent <strong>{intentPassed}/{result.executionIntent.checks.length}</strong></span>
      <span>Principal ceiling <strong>${result.executionIntent.record.principal_cap_usd.toLocaleString()}</strong></span>
    </div>
    <code title={result.credential.stateRootHash}>State root {shortHash(result.credential.stateRootHash)}</code>
  </div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="field"><span>{label}</span>{children}</label>; }
function LockedState({ label }: { label: string }) { return <div className="locked-state"><Blocks size={28} /><strong>{label}</strong><span>Complete the preceding workflow step to continue.</span></div>; }

function CredentialView({ result }: { result: ReportResponse }) {
  const isLive = result.attestation.network === "casper-testnet";
  const manifest = result.report.evidenceManifest;
  return <div className="credential-surface">
    <div className="score-block"><span>Risk score</span><strong>{result.report.riskScore}</strong><em>{result.report.decision}</em><small>{result.report.confidence}% confidence</small></div>
    <div className="factor-list">{result.report.factors.map((factor) => <div key={factor.id}><span>{factor.label}</span><div><i style={{ width: `${factor.score}%` }} /></div><strong>{factor.score}</strong></div>)}</div>
    <div className="credential-facts"><Fact label="Asset ID" value={result.report.assetId} /><Fact label="Report hash" value={result.report.reportHash} /><Fact label="Evidence hash" value={result.report.evidenceHash} /><Fact label="Entry point" value={result.registryCall.entryPoint} /><Fact label="Current run" value={isLive ? "Casper Testnet" : "Local deterministic adapter"} /><Fact label="Transaction" value={result.attestation.transactionHash} /></div>
    {manifest ? <div className="manifest-panel">
      <div className="manifest-heading"><FileCheck2 size={18} /><div><strong>Evidence manifest verified</strong><span>{manifest.synthetic ? "Synthetic demonstration dataset" : "Submitted evidence"} · {manifest.documentCount} content-hashed {manifest.documentCount === 1 ? "document" : "documents"}</span></div><code title={manifest.manifestHash}>{shortHash(manifest.manifestHash)}</code></div>
      <div className="manifest-documents">{manifest.documents.map((document) => <div key={document.id}><span>{document.title}</span><code>{shortHash(document.sha256)}</code></div>)}</div>
    </div> : null}
    {result.report.provenance ? <div className="agent-runtime-panel">
      <div><Activity size={18} /><span><strong>Bounded agent runtime</strong><small>{result.report.provenance.workflowVersion} / {result.report.provenance.runtimeMode}</small></span></div>
      <dl>
        <dt>Input digest</dt><dd><code>{shortHash(result.report.provenance.inputHash)}</code></dd>
        <dt>Decision authority</dt><dd>{result.report.provenance.decisionAuthority}</dd>
        <dt>Evidence authority</dt><dd>{result.report.provenance.evidenceAuthority}</dd>
        <dt>Private key access</dt><dd>none</dd>
      </dl>
    </div> : null}
    <div className={`run-mode ${isLive ? "live" : "mock"}`}><BadgeCheck size={17} /><span>{isLive ? "This run was written to Casper Testnet." : "This local run is reproducible. Published Testnet proof is shown above."}</span></div>
  </div>;
}

function Fact({ label, value }: { label: string; value: string }) { return <div><span>{label}</span><code>{value}</code></div>; }
function NumberControl({ label, value, prefix = "", suffix = "", step = 1, readOnly = false, onChange }: { label: string; value: number; prefix?: string; suffix?: string; step?: number; readOnly?: boolean; onChange?: (value: number) => void }) { return <label className={`number-control ${readOnly ? "read-only" : ""}`}><span>{label}</span><div>{prefix ? <i>{prefix}</i> : null}<input type="number" step={step} value={value} readOnly={readOnly} aria-readonly={readOnly} onChange={(event) => onChange?.(Number(event.target.value))} />{suffix ? <i>{suffix}</i> : null}</div></label>; }
function Toggle({ label, checked, danger = false, onChange }: { label: string; checked: boolean; danger?: boolean; onChange: (checked: boolean) => void }) { return <label className={`toggle ${danger ? "danger" : ""}`}><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><span>{label}</span></label>; }
function shortHash(value: string) { return value.length > 32 ? `${value.slice(0, 14)}…${value.slice(-10)}` : value; }
function supportedMediaType(file: File): "application/json" | "text/csv" | "text/plain" | "application/pdf" {
  const extension = file.name.toLowerCase().split(".").pop();
  if (file.type === "application/json" || extension === "json") return "application/json";
  if (file.type === "text/csv" || extension === "csv") return "text/csv";
  if (file.type === "application/pdf" || extension === "pdf") return "application/pdf";
  if (file.type === "text/plain" || extension === "txt") return "text/plain";
  throw new Error(`${file.name} is not a supported evidence format.`);
}
function inferEvidenceType(name: string): EvidenceManifest["documents"][number]["type"] {
  const value = name.toLowerCase();
  if (value.includes("invoice")) return "invoice_register";
  if (value.includes("purchase") || value.includes("order") || value.includes("po-")) return "purchase_order";
  if (value.includes("delivery") || value.includes("acceptance")) return "delivery_confirmation";
  if (value.includes("payment") || value.includes("history")) return "payment_history";
  return "other";
}
function bytesToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let index = 0; index < bytes.length; index += 32_768) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 32_768));
  }
  return btoa(binary);
}
