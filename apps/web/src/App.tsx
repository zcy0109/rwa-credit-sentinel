import { useEffect, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import {
  BadgeCheck,
  Database,
  FileSearch,
  Link2,
  Play,
  RotateCcw,
  ShieldCheck,
  WalletCards
} from "lucide-react";
import type { AssetType, CasperAttestation, FinancingRequest, RiskReport } from "@rwa-sentinel/shared";
import "./styles.css";

const verifiedCasperProof = {
  deploymentHash: "735dab5995084abfe4494398ff6f3c6677055a4d5025b79918ae9c4a202a93b9",
  deploymentUrl:
    "https://testnet.cspr.live/transaction/735dab5995084abfe4494398ff6f3c6677055a4d5025b79918ae9c4a202a93b9",
  recordHash: "096907b2961fe30d01d0267a2876922225d2b43e37f124a40608330e500341f0",
  recordUrl:
    "https://testnet.cspr.live/transaction/096907b2961fe30d01d0267a2876922225d2b43e37f124a40608330e500341f0",
  deploymentBlockHeight: "8320720",
  contractHash: "aeda10dacdee9cefa8b857c3f6c8a0b2edeb6c19421f16189016ab1a2359b391",
  entryPoint: "record_credential"
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

type CredentialListResponse = {
  credentials: ReportResponse[];
};

type IntakeForm = Omit<FinancingRequest, "requestedAmountUsd" | "maturityDays" | "publicEvidenceUrls"> & {
  requestedAmountUsd: string;
  maturityDays: string;
  publicEvidenceUrls: string;
};

const sampleForm: IntakeForm = {
  assetName: "Acme Invoice Batch A",
  assetType: "invoice",
  requestedAmountUsd: "125000",
  maturityDays: "45",
  debtorName: "Acme Manufacturing",
  debtorCountry: "US",
  description:
    "Thirty invoices from a recurring industrial buyer with public purchase-order references and predictable 45-day repayment behavior.",
  publicEvidenceUrls: "https://example.com/invoice-a\nhttps://example.com/purchase-order-a"
};

export default function App() {
  const [form, setForm] = useState<IntakeForm>(sampleForm);
  const [result, setResult] = useState<ReportResponse | null>(null);
  const [credentials, setCredentials] = useState<ReportResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMockAttestation = result?.attestation.network === "mock" || result?.attestation.method === "mock";

  useEffect(() => {
    void refreshCredentials();
  }, []);

  function updateField(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function buildRequest(): FinancingRequest {
    return {
      assetName: form.assetName,
      assetType: form.assetType,
      requestedAmountUsd: Number(form.requestedAmountUsd),
      maturityDays: Number(form.maturityDays),
      debtorName: form.debtorName,
      debtorCountry: form.debtorCountry,
      description: form.description,
      publicEvidenceUrls: form.publicEvidenceUrls
        .split(/\r?\n/)
        .map((url) => url.trim())
        .filter(Boolean)
    };
  }

  async function runAssessment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildRequest())
      });

      if (!response.ok) {
        const details = await response.text();
        throw new Error(`API returned ${response.status}: ${details}`);
      }

      const credential = (await response.json()) as ReportResponse;
      setResult(credential);
      await refreshCredentials();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  async function refreshCredentials() {
    const response = await fetch("/api/credentials");
    if (!response.ok) {
      return;
    }

    const payload = (await response.json()) as CredentialListResponse;
    setCredentials(payload.credentials);
  }

  return (
    <main className="shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Casper Agentic Buildathon 2026</p>
          <h1>RWA Credit Sentinel</h1>
          <p className="lede">
            Agentic credit-risk analysis for real-world asset financing, anchored as verifiable
            Casper risk credentials for DeFi lending gates.
          </p>
        </div>
        <div className="hero-status">
          <ShieldCheck size={22} />
          <span>Casper Testnet verified</span>
        </div>
      </section>

      <section className="proof-strip">
        <div>
          <p className="eyebrow">Verified Casper Evidence</p>
          <h2>Published Testnet proof from the verified buildathon run</h2>
        </div>
        <dl>
          <dt>Mode</dt>
          <dd>Real Casper Testnet contract registry</dd>
          <dt>Deploy</dt>
          <dd>
            <a href={verifiedCasperProof.deploymentUrl} target="_blank" rel="noreferrer">
              {verifiedCasperProof.deploymentHash}
            </a>
          </dd>
          <dt>Registry Write</dt>
          <dd>
            <a href={verifiedCasperProof.recordUrl} target="_blank" rel="noreferrer">
              {verifiedCasperProof.recordHash}
            </a>
          </dd>
          <dt>Contract</dt>
          <dd>{verifiedCasperProof.contractHash}</dd>
          <dt>Entry Point</dt>
          <dd>{verifiedCasperProof.entryPoint}</dd>
          <dt>Deploy Block</dt>
          <dd>{verifiedCasperProof.deploymentBlockHeight}</dd>
        </dl>
      </section>

      {error ? <p className="error">{error}</p> : null}

      <section className="workspace">
        <form className="panel intake" onSubmit={runAssessment}>
          <div className="panel-heading">
            <div>
              <p className="eyebrow">RWA Intake</p>
              <h2>Financing Request</h2>
            </div>
            <button type="button" className="secondary" onClick={() => setForm(sampleForm)}>
              <RotateCcw size={16} />
              Sample
            </button>
          </div>

          <div className="form-grid">
            <label>
              Asset name
              <input name="assetName" value={form.assetName} onChange={updateField} />
            </label>
            <label>
              Asset type
              <select name="assetType" value={form.assetType} onChange={updateField}>
                {(["invoice", "trade_receivable", "real_estate", "commodity", "other"] as AssetType[]).map(
                  (type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  )
                )}
              </select>
            </label>
            <label>
              Requested amount USD
              <input
                name="requestedAmountUsd"
                inputMode="numeric"
                value={form.requestedAmountUsd}
                onChange={updateField}
              />
            </label>
            <label>
              Maturity days
              <input name="maturityDays" inputMode="numeric" value={form.maturityDays} onChange={updateField} />
            </label>
            <label>
              Debtor
              <input name="debtorName" value={form.debtorName} onChange={updateField} />
            </label>
            <label>
              Debtor country
              <input name="debtorCountry" value={form.debtorCountry} onChange={updateField} />
            </label>
          </div>

          <label>
            Asset description
            <textarea name="description" rows={4} value={form.description} onChange={updateField} />
          </label>
          <label>
            Evidence URLs
            <textarea
              name="publicEvidenceUrls"
              rows={3}
              value={form.publicEvidenceUrls}
              onChange={updateField}
            />
          </label>

          <button type="submit" disabled={loading}>
            <Play size={17} />
            {loading ? "Running agents" : "Run agent assessment"}
          </button>
        </form>

        <section className="workflow">
          <Step
            icon={<FileSearch size={22} />}
            title="RWA Intake"
            text="Invoice-backed financing request is normalized for analysis."
          />
          <Step
            icon={<BadgeCheck size={22} />}
            title="Agentic Risk"
            text="Specialized agents score evidence, exposure, maturity, and debtor signals."
          />
          <Step
            icon={<Link2 size={22} />}
            title="Casper Attestation"
            text="Report and evidence hashes are anchored to a Casper-compatible credential."
          />
          <Step
            icon={<WalletCards size={22} />}
            title="DeFi Gate"
            text="The risk credential decides financing eligibility and advance limits."
          />
          <Step
            icon={<Database size={22} />}
            title="Credential Registry"
            text="Recent reports remain queryable for DeFi protocol integrations."
          />
        </section>
      </section>

      {result ? (
        <section className="results">
          <article className="panel score-panel">
            <p className="label">Risk Score</p>
            <strong>{result.report.riskScore}</strong>
            <span className={`decision ${result.report.decision}`}>{result.report.decision}</span>
            <p>{result.report.confidence}% confidence</p>
          </article>

          <article className="panel">
            <h2>Agent Trace</h2>
            <div className="trace">
              {result.report.agentTrace.map((step) => (
                <div key={step.agent}>
                  <strong>{step.agent}</strong>
                  <p>{step.summary}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="panel">
            <h2>Risk Factors</h2>
            <div className="factors">
              {result.report.factors.map((factor) => (
                <div key={factor.id}>
                  <span>{factor.label}</span>
                  <meter min={0} max={100} value={factor.score} />
                  <b>{factor.score}</b>
                </div>
              ))}
            </div>
          </article>

          <article className="panel hash-panel">
            <div className="panel-heading compact-heading">
              <h2>{isMockAttestation ? "Casper Credential Preview" : "Casper Credential"}</h2>
              <span className={`mode-badge ${isMockAttestation ? "mock" : "real"}`}>
                {isMockAttestation ? "Local mock run" : "Live Testnet run"}
              </span>
            </div>
            <dl>
              <dt>Network</dt>
              <dd>{result.attestation.network}</dd>
              <dt>Method</dt>
              <dd>{result.attestation.method}</dd>
              {result.attestation.method === "contract-registry" ? (
                <>
                  <dt>Contract Hash</dt>
                  <dd>{result.attestation.contractHash}</dd>
                  <dt>Entry Point</dt>
                  <dd>{result.attestation.entryPoint}</dd>
                </>
              ) : (
                <>
                  <dt>Transfer ID</dt>
                  <dd>{result.attestation.transferId ?? "n/a"}</dd>
                </>
              )}
              <dt>Transaction</dt>
              <dd>
                {result.attestation.explorerUrl ? (
                  <a href={result.attestation.explorerUrl} target="_blank" rel="noreferrer">
                    {result.attestation.transactionHash}
                  </a>
                ) : (
                  result.attestation.transactionHash
                )}
              </dd>
              <dt>Report Hash</dt>
              <dd>{result.report.reportHash}</dd>
              <dt>Evidence Hash</dt>
              <dd>{result.report.evidenceHash}</dd>
            </dl>
            {isMockAttestation ? (
              <p className="mode-note">
                This card is generated by the local repeatable mock adapter. The deployed contract and a real
                registry write are shown in the proof strip above.
              </p>
            ) : (
              <p className="mode-note success">
                This credential was submitted directly to the deployed Casper Testnet registry contract.
              </p>
            )}
          </article>

          <article className="panel registry-path">
            <div>
              <p className="eyebrow">Casper Registry Path</p>
              <h2>From Attestation To Contract State</h2>
            </div>
            <div className="path-grid">
              <div>
                <span>{isMockAttestation ? "Current local run" : "Current chain run"}</span>
                <strong>{result.attestation.method}</strong>
                <p>
                  {isMockAttestation
                    ? "Repeatable mock credential for local judging; the published contract write is above."
                    : "The API submitted a record_credential call to the deployed Casper contract."}
                </p>
              </div>
              <div>
                <span>Contract</span>
                <strong>{result.registryCall.contractHash ?? verifiedCasperProof.contractHash}</strong>
                <p>Risk score, decision, report hash, and evidence hash become registry state.</p>
              </div>
            </div>
            <dl className="registry-call">
              <dt>Entry Point</dt>
              <dd>{result.registryCall.entryPoint}</dd>
              <dt>Status</dt>
              <dd>{result.registryCall.status}</dd>
              <dt>Contract Hash</dt>
              <dd>{result.registryCall.contractHash ?? "set CASPER_RISK_REGISTRY_HASH after deploy"}</dd>
            </dl>
            <pre>{JSON.stringify(result.registryCall.args, null, 2)}</pre>
          </article>
        </section>
      ) : null}

      <section className="panel registry">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Local Credential Registry</p>
            <h2>Recent Credentials</h2>
          </div>
          <button type="button" className="secondary" onClick={refreshCredentials}>
            <RotateCcw size={16} />
            Refresh
          </button>
        </div>

        {credentials.length ? (
          <div className="registry-list">
            {credentials.map((credential) => (
              <article key={`${credential.report.assetId}-${credential.savedAt}`} className="registry-row">
                <div>
                  <strong>{credential.report.request.assetName}</strong>
                  <span>{credential.report.assetId}</span>
                </div>
                <span className={`decision compact ${credential.report.decision}`}>
                  {credential.report.decision}
                </span>
                <span>{credential.report.riskScore}</span>
                <code>{credential.attestation.transactionHash}</code>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty">Run an assessment to populate the local credential registry.</p>
        )}
      </section>
    </main>
  );
}

function Step({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <article className="step">
      <div>{icon}</div>
      <h2>{title}</h2>
      <p>{text}</p>
    </article>
  );
}
