import { existsSync, readFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import casperSdk from "casper-js-sdk";
import { readCasperConfig } from "../src/index.js";

dotenv.config({ path: new URL("../../../.env", import.meta.url), quiet: true });
dotenv.config({ quiet: true });

const {
  Args,
  Deploy,
  DeployHeader,
  ExecutableDeployItem,
  HttpHandler,
  KeyAlgorithm,
  PrivateKey,
  RpcClient
} = casperSdk as typeof import("casper-js-sdk");

const repoRoot = resolve(fileURLToPath(new URL("../../..", import.meta.url)));
const defaultWasmPath = resolve(
  repoRoot,
  "contracts/risk-registry/wasm/RiskRegistry.wasm"
);

const config = readCasperConfig(process.env);
const wasmPath = resolve(process.env.CASPER_REGISTRY_WASM_PATH ?? defaultWasmPath);
const paymentAmount = process.env.CASPER_CONTRACT_PAYMENT_MOTES ?? "200000000000";
const waitMs = Number(process.env.CASPER_DEPLOY_WAIT_MS ?? 180_000);

try {
  if (config.mode !== "real") {
    throw new Error("CASPER_MODE must be real before deploying the registry contract.");
  }

  if (!existsSync(wasmPath)) {
    throw new Error(`Registry Wasm not found: ${wasmPath}`);
  }

  const privateKey = readPrivateKey();
  const wasmBytes = readFileSync(wasmPath);
  const rpcClient = new RpcClient(new HttpHandler(config.rpcUrl));
  const deployHeader = DeployHeader.default();
  deployHeader.account = privateKey.publicKey;
  deployHeader.chainName = config.chainName;

  const payment = ExecutableDeployItem.standardPayment(paymentAmount);
  const session = ExecutableDeployItem.newModuleBytes(wasmBytes, Args.fromMap({}));
  const deploy = Deploy.makeDeploy(deployHeader, payment, session);
  deploy.sign(privateKey);

  const deployHash = deploy.hash.toHex();
  const deploySizeBytes = Deploy.getDeploySizeInBytes(deploy);

  console.log(
    JSON.stringify(
      {
        ok: true,
        phase: "prepared",
        rpcUrl: config.rpcUrl,
        chainName: config.chainName,
        publicKeyHex: privateKey.publicKey.toHex(),
        wasmFile: basename(wasmPath),
        wasmBytes: wasmBytes.length,
        deploySizeBytes,
        paymentMotes: paymentAmount,
        deployHash,
        explorerUrl: `${config.explorerBaseUrl}/${deployHash}`
      },
      null,
      2
    )
  );

  const result = (await rpcClient.putDeploy(deploy)) as { deployHash?: unknown };
  const submittedDeployHash = stringifyDeployHash(result.deployHash) ?? deployHash;

  console.log(
    JSON.stringify(
      {
        ok: true,
        phase: "submitted",
        deployHash: submittedDeployHash,
        explorerUrl: `${config.explorerBaseUrl}/${submittedDeployHash}`
      },
      null,
      2
    )
  );

  const confirmed = await rpcClient.waitForDeploy(deploy, waitMs);
  const executionResult = extractExecutionResult(confirmed);
  const success = Boolean(executionResult) && !executionResult.errorMessage;

  console.log(
    JSON.stringify(
      {
        ok: success,
        phase: "confirmed",
        deployHash: submittedDeployHash,
        explorerUrl: `${config.explorerBaseUrl}/${submittedDeployHash}`,
        blockHeight: extractBlockHeight(confirmed),
        executionResult
      },
      null,
      2
    )
  );

  if (!success) {
    process.exitCode = 1;
  }
} catch (error) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error)
      },
      null,
      2
    )
  );
  process.exitCode = 1;
}

function readPrivateKey() {
  const algorithm =
    config.keyAlgorithm === "SECP256K1" ? KeyAlgorithm.SECP256K1 : KeyAlgorithm.ED25519;

  if (config.privateKeyPem) {
    return PrivateKey.fromPem(config.privateKeyPem.replace(/\\n/g, "\n"), algorithm);
  }

  if (config.privateKeyPemFile) {
    return PrivateKey.fromPem(readFileSync(config.privateKeyPemFile, "utf8"), algorithm);
  }

  if (config.privateKeyHex) {
    return PrivateKey.fromHex(config.privateKeyHex, algorithm);
  }

  throw new Error(
    "CASPER_PRIVATE_KEY_HEX, CASPER_PRIVATE_KEY_PEM, or CASPER_PRIVATE_KEY_PEM_FILE is required."
  );
}

function stringifyDeployHash(value: unknown): string | undefined {
  if (!value) {
    return undefined;
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object") {
    const candidate = value as { toHex?: () => string; toJSON?: () => unknown };
    if (typeof candidate.toHex === "function") {
      return candidate.toHex();
    }

    if (typeof candidate.toJSON === "function") {
      const json = candidate.toJSON();
      return typeof json === "string" ? json : undefined;
    }
  }

  return undefined;
}

function extractExecutionResult(value: unknown): { errorMessage?: string } | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as {
    executionInfo?: { executionResult?: { errorMessage?: string } };
    executionResults?: Array<{ result?: { errorMessage?: string } }>;
  };

  return (
    candidate.executionInfo?.executionResult ??
    candidate.executionResults?.[0]?.result ??
    null
  );
}

function extractBlockHeight(value: unknown): number | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const candidate = value as { executionInfo?: { blockHeight?: number } };
  return candidate.executionInfo?.blockHeight;
}
