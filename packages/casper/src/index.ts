import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import casperSdk from "casper-js-sdk";
import type { CasperAttestation, RiskDecision } from "@rwa-sentinel/shared";
export {
  buildRiskRegistryCallPreview,
  RISK_REGISTRY_ENTRY_POINTS,
  toRiskRegistryRecordArgs,
  type RegistryDecision,
  type RiskRegistryCallPreview,
  type RiskRegistryRecordArgs
} from "./registryContract.js";
import { RISK_REGISTRY_ENTRY_POINTS, toRiskRegistryRecordArgs } from "./registryContract.js";

const {
  Args,
  CLValue,
  ContractHash,
  Deploy,
  DeployHeader,
  ExecutableDeployItem,
  HttpHandler,
  KeyAlgorithm,
  NativeTransferBuilder,
  PrivateKey,
  PurseIdentifier,
  RpcClient,
  StoredContractByHash
} = casperSdk as typeof import("casper-js-sdk");

export type AttestRiskCredentialInput = {
  assetId: string;
  riskScore: number;
  decision: RiskDecision;
  reportHash: string;
  evidenceHash: string;
  issuer?: string;
  createdAtMs?: number;
};

export type CasperAdapter = {
  attestRiskCredential(input: AttestRiskCredentialInput): Promise<CasperAttestation>;
};

export type CasperAdapterConfig = {
  mode: "mock" | "real";
  rpcUrl: string;
  chainName: string;
  keyAlgorithm: "ED25519" | "SECP256K1";
  privateKeyHex?: string;
  privateKeyPem?: string;
  privateKeyPemFile?: string;
  paymentMotes: number;
  transferAmountMotes: string;
  contractCallPaymentMotes: string;
  riskRegistryHash?: string;
  explorerBaseUrl: string;
};

export type CasperRealModePreflight = {
  mode: "real";
  rpcUrl: string;
  chainName: string;
  publicKeyHex: string;
  requiredMotes: string;
  balanceMotes: string;
  hasSufficientBalance: boolean;
  nodeApiVersion?: string;
  peerCount?: number;
  warnings: string[];
};

const DEFAULT_TESTNET_RPC = "https://node.testnet.casper.network/rpc";
const DEFAULT_TESTNET_EXPLORER = "https://testnet.cspr.live/transaction";

export function createCasperAdapterFromEnv(env: NodeJS.ProcessEnv = process.env): CasperAdapter {
  const config = readCasperConfig(env);
  if (config.mode === "real" && hasSigningKey(config) && config.riskRegistryHash) {
    return new CasperRegistryAttestationAdapter(config);
  }

  if (config.mode === "real" && hasSigningKey(config)) {
    return new CasperTransferAttestationAdapter(config);
  }

  return new MockCasperAdapter();
}

export function readCasperConfig(env: NodeJS.ProcessEnv): CasperAdapterConfig {
  return {
    mode: env.CASPER_MODE === "real" ? "real" : "mock",
    rpcUrl: env.CASPER_RPC_URL ?? DEFAULT_TESTNET_RPC,
    chainName: env.CASPER_CHAIN_NAME ?? "casper-test",
    keyAlgorithm: env.CASPER_KEY_ALGORITHM === "SECP256K1" ? "SECP256K1" : "ED25519",
    privateKeyHex: env.CASPER_PRIVATE_KEY_HEX,
    privateKeyPem: env.CASPER_PRIVATE_KEY_PEM,
    privateKeyPemFile: env.CASPER_PRIVATE_KEY_PEM_FILE,
    paymentMotes: Number(env.CASPER_PAYMENT_MOTES ?? 100_000_000),
    transferAmountMotes: env.CASPER_TRANSFER_AMOUNT_MOTES ?? "2500000000",
    contractCallPaymentMotes: env.CASPER_CONTRACT_CALL_PAYMENT_MOTES ?? "20000000000",
    riskRegistryHash: env.CASPER_RISK_REGISTRY_HASH,
    explorerBaseUrl: env.CASPER_EXPLORER_BASE_URL ?? DEFAULT_TESTNET_EXPLORER
  };
}

export class MockCasperAdapter implements CasperAdapter {
  async attestRiskCredential(input: AttestRiskCredentialInput): Promise<CasperAttestation> {
    const transferId = deriveTransferId(input.reportHash);
    const encoded = [
      input.assetId,
      input.riskScore,
      input.decision,
      input.reportHash,
      input.evidenceHash,
      transferId
    ].join(":");
    const transactionHash = await sha256Hex(encoded);

    return {
      assetId: input.assetId,
      riskScore: input.riskScore,
      decision: input.decision,
      reportHash: input.reportHash,
      evidenceHash: input.evidenceHash,
      issuer: input.issuer ?? "rwa-credit-sentinel-demo",
      network: "mock",
      method: "mock",
      transferId,
      transactionHash: `mock-${transactionHash.slice(0, 48)}`,
      createdAt: new Date().toISOString()
    };
  }
}

export class CasperRegistryAttestationAdapter implements CasperAdapter {
  constructor(private readonly config: CasperAdapterConfig) {}

  async attestRiskCredential(input: AttestRiskCredentialInput): Promise<CasperAttestation> {
    if (!this.config.riskRegistryHash) {
      throw new Error("CASPER_RISK_REGISTRY_HASH is required for contract registry attestation.");
    }

    const privateKey = readPrivateKey(this.config);
    const rpcClient = new RpcClient(new HttpHandler(this.config.rpcUrl));
    const recordArgs = toRiskRegistryRecordArgs(input);
    const deployHeader = DeployHeader.default();
    deployHeader.account = privateKey.publicKey;
    deployHeader.chainName = this.config.chainName;

    const session = new ExecutableDeployItem();
    session.storedContractByHash = new StoredContractByHash(
      ContractHash.fromJSON(normalizeHash(this.config.riskRegistryHash)),
      RISK_REGISTRY_ENTRY_POINTS.recordCredential,
      Args.fromMap(
        {
          asset_id: CLValue.newCLString(recordArgs.asset_id),
          risk_score: CLValue.newCLUint8(recordArgs.risk_score),
          decision: CLValue.newCLString(recordArgs.decision),
          report_hash: CLValue.newCLString(recordArgs.report_hash),
          evidence_hash: CLValue.newCLString(recordArgs.evidence_hash),
          created_at_ms: CLValue.newCLUint64(recordArgs.created_at_ms.toString())
        } as unknown as Record<string, never>
      )
    );

    const payment = ExecutableDeployItem.standardPayment(this.config.contractCallPaymentMotes);
    const deploy = Deploy.makeDeploy(deployHeader, payment, session);
    deploy.sign(privateKey);

    const result = (await rpcClient.putDeploy(deploy)) as { deployHash?: unknown };
    const transactionHash = stringifyTransactionHash(result.deployHash ?? deploy.hash);
    const confirmed = await rpcClient.waitForDeploy(deploy, Number(process.env.CASPER_REGISTRY_WAIT_MS ?? 180_000));
    const executionResult = extractDeployExecutionResult(confirmed);

    if (executionResult?.errorMessage) {
      throw new Error(`Casper registry call failed: ${executionResult.errorMessage}`);
    }

    return {
      assetId: input.assetId,
      riskScore: input.riskScore,
      decision: input.decision,
      reportHash: input.reportHash,
      evidenceHash: input.evidenceHash,
      issuer: input.issuer ?? privateKey.publicKey.toHex(),
      network: "casper-testnet",
      method: "contract-registry",
      contractHash: normalizeHash(this.config.riskRegistryHash),
      entryPoint: RISK_REGISTRY_ENTRY_POINTS.recordCredential,
      transactionHash,
      explorerUrl: `${this.config.explorerBaseUrl}/${transactionHash}`,
      createdAt: new Date(recordArgs.created_at_ms).toISOString()
    };
  }
}

export class CasperTransferAttestationAdapter implements CasperAdapter {
  constructor(private readonly config: CasperAdapterConfig) {}

  async attestRiskCredential(input: AttestRiskCredentialInput): Promise<CasperAttestation> {
    const privateKey = readPrivateKey(this.config);
    const transferId = deriveTransferId(input.reportHash);
    const rpcClient = new RpcClient(new HttpHandler(this.config.rpcUrl));

    const transaction = new NativeTransferBuilder()
      .from(privateKey.publicKey)
      .target(privateKey.publicKey)
      .amount(this.config.transferAmountMotes)
      .id(transferId)
      .chainName(this.config.chainName)
      .payment(this.config.paymentMotes)
      .build();

    transaction.sign(privateKey);

    const result = await rpcClient.putTransaction(transaction);
    const transactionHash = stringifyTransactionHash(result.transactionHash);

    return {
      assetId: input.assetId,
      riskScore: input.riskScore,
      decision: input.decision,
      reportHash: input.reportHash,
      evidenceHash: input.evidenceHash,
      issuer: input.issuer ?? privateKey.publicKey.toHex(),
      network: "casper-testnet",
      method: "native-transfer-memo",
      transferId,
      transactionHash,
      explorerUrl: `${this.config.explorerBaseUrl}/${transactionHash}`,
      createdAt: new Date().toISOString()
    };
  }
}

export async function runCasperRealModePreflight(
  env: NodeJS.ProcessEnv = process.env
): Promise<CasperRealModePreflight> {
  const config = readCasperConfig(env);
  if (config.mode !== "real") {
    throw new Error("CASPER_MODE must be set to real for Casper real-mode preflight.");
  }

  if (!hasSigningKey(config)) {
    throw new Error(
      "CASPER_PRIVATE_KEY_HEX, CASPER_PRIVATE_KEY_PEM, or CASPER_PRIVATE_KEY_PEM_FILE is required for real mode."
    );
  }

  const privateKey = readPrivateKey(config);
  const publicKeyHex = privateKey.publicKey.toHex();
  const rpcClient = new RpcClient(new HttpHandler(config.rpcUrl));
  const status = (await rpcClient.getStatus()) as {
    apiVersion?: string;
    api_version?: string;
    peers?: unknown[];
  };
  const balanceResult = (await rpcClient.queryLatestBalance(
    PurseIdentifier.fromPublicKey(privateKey.publicKey)
  )) as { balance: { toString(): string } };

  const requiredMotes = BigInt(config.transferAmountMotes) + BigInt(config.paymentMotes);
  const balanceMotes = balanceResult.balance.toString();
  const hasSufficientBalance = BigInt(balanceMotes) >= requiredMotes;
  const warnings: string[] = [];

  if (!hasSufficientBalance) {
    warnings.push(
      `Balance is below required amount. Need at least ${requiredMotes.toString()} motes for transfer plus payment.`
    );
  }

  return {
    mode: "real",
    rpcUrl: config.rpcUrl,
    chainName: config.chainName,
    publicKeyHex,
    requiredMotes: requiredMotes.toString(),
    balanceMotes,
    hasSufficientBalance,
    nodeApiVersion: status.apiVersion ?? status.api_version,
    peerCount: status.peers?.length,
    warnings
  };
}

function stringifyTransactionHash(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object") {
    const candidate = value as {
      toHex?: () => string;
      toJSON?: () => unknown;
      transactionV1?: { toHex?: () => string };
      deploy?: { toHex?: () => string };
    };

    if (typeof candidate.toHex === "function") {
      return candidate.toHex();
    }

    if (typeof candidate.transactionV1?.toHex === "function") {
      return candidate.transactionV1.toHex();
    }

    if (typeof candidate.deploy?.toHex === "function") {
      return candidate.deploy.toHex();
    }

    if (typeof candidate.toJSON === "function") {
      const json = candidate.toJSON();
      if (typeof json === "string") {
        return json;
      }
    }
  }

  throw new Error("Unable to read Casper transaction hash from RPC response.");
}

function extractDeployExecutionResult(value: unknown): { errorMessage?: string | null } | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as {
    executionInfo?: { executionResult?: { errorMessage?: string | null } };
    executionResults?: Array<{ result?: { errorMessage?: string | null } }>;
  };

  return candidate.executionInfo?.executionResult ?? candidate.executionResults?.[0]?.result ?? null;
}

function normalizeHash(value: string): string {
  return value.replace(/^hash-/, "").replace(/^contract-/, "");
}

function hasSigningKey(config: CasperAdapterConfig): boolean {
  return Boolean(config.privateKeyHex || config.privateKeyPem || config.privateKeyPemFile);
}

function readPrivateKey(config: CasperAdapterConfig) {
  const algorithm =
    config.keyAlgorithm === "SECP256K1" ? KeyAlgorithm.SECP256K1 : KeyAlgorithm.ED25519;

  if (config.privateKeyPem) {
    return PrivateKey.fromPem(config.privateKeyPem.replace(/\\n/g, "\n"), algorithm);
  }

  if (config.privateKeyPemFile) {
    return PrivateKey.fromPem(readFileSync(resolveConfigFile(config.privateKeyPemFile), "utf8"), algorithm);
  }

  if (config.privateKeyHex) {
    return PrivateKey.fromHex(config.privateKeyHex, algorithm);
  }

  throw new Error(
    "CASPER_PRIVATE_KEY_HEX, CASPER_PRIVATE_KEY_PEM, or CASPER_PRIVATE_KEY_PEM_FILE is required for real mode."
  );
}

function resolveConfigFile(filePath: string): string {
  if (path.isAbsolute(filePath)) {
    return filePath;
  }

  let current = process.cwd();
  for (let depth = 0; depth < 6; depth += 1) {
    const candidate = path.resolve(current, filePath);
    if (existsSync(candidate)) {
      return candidate;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      break;
    }
    current = parent;
  }

  return path.resolve(process.cwd(), filePath);
}

function deriveTransferId(reportHash: string): number {
  const slice = reportHash.replace(/^0x/, "").slice(0, 12);
  return Number.parseInt(slice, 16);
}

async function sha256Hex(value: string): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
