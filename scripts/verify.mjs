import { spawn } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const apiPort = 8797;

const checks = [];

async function main() {
  await step("Build all workspaces", () => run(npmCommand, ["run", "build"]));
  await step("Run automated tests", () => run(npmCommand, ["test"]));
  await step("Run Casper mock smoke", () =>
    run(npmCommand, ["--workspace", "packages/casper", "run", "smoke:mock"])
  );
  await step("Check finals registry contract source", checkContractSource);
  await step("Check built frontend includes finals proof", checkFrontendBundle);
  await step("Exercise underwriting, policy, and execution API", exerciseApi);
  await optionalStep("Check Rust/Cargo availability", () => run("cargo", ["--version"]));

  printSummary();
}

async function step(name, fn) {
  process.stdout.write(`\n[verify] ${name}...\n`);
  try {
    const output = await fn();
    checks.push({ name, status: "pass" });
    if (output) {
      process.stdout.write(`${output.trim()}\n`);
    }
  } catch (error) {
    checks.push({ name, status: "fail", details: formatError(error) });
    printSummary();
    throw error;
  }
}

async function optionalStep(name, fn) {
  process.stdout.write(`\n[verify] ${name}...\n`);
  try {
    const output = await fn();
    checks.push({ name, status: "pass" });
    if (output) {
      process.stdout.write(`${output.trim()}\n`);
    }
  } catch (error) {
    const details = formatError(error);
    checks.push({ name, status: "warn", details });
    process.stdout.write(`[warn] ${details}\n`);
  }
}

function checkContractSource() {
  const contractPath = join(root, "contracts", "risk-registry", "src", "lib.rs");
  const readmePath = join(root, "contracts", "risk-registry", "README.md");

  assert(existsSync(contractPath), "contracts/risk-registry/src/lib.rs is missing");
  assert(existsSync(readmePath), "contracts/risk-registry/README.md is missing");

  const source = readFileSync(contractPath, "utf8");
  for (const token of [
    "record_credential",
    "get_credential",
    "record_execution_intent",
    "get_execution_intent",
    "owner",
    "records",
    "execution_intents"
  ]) {
    assert(source.includes(token), `Contract source does not include ${token}`);
  }

  return "Finals contract contains credential and execution-intent write/read entry points.";
}

function checkFrontendBundle() {
  const assetsDir = join(root, "apps", "web", "dist", "assets");
  assert(existsSync(assetsDir), "web dist assets are missing; run build first");

  const jsFiles = readdirSync(assetsDir).filter((file) => file.endsWith(".js"));
  assert(jsFiles.length > 0, "web dist bundle is missing JavaScript assets");

  const bundleText = jsFiles.map((file) => readFileSync(join(assetsDir, file), "utf8")).join("\n");
  assert(bundleText.includes("Two real state transitions on Casper"), "frontend bundle is missing finals proof heading");
  assert(bundleText.includes("record_credential"), "frontend bundle is missing record_credential");
  assert(bundleText.includes("record_execution_intent"), "frontend bundle is missing record_execution_intent");
  assert(bundleText.includes("Anchor execution intent"), "frontend bundle is missing execution anchor action");
  assert(
    bundleText.includes("694147496b0af6dfe83bf0a32cecd16ae6e09b8a141087f6cc0bcffea0f252c0"),
    "frontend bundle is missing the finals contract deployment hash"
  );
  assert(
    bundleText.includes("2267d02bb600d20d500a6c670bdda5576ef5ab950db04f63302266538a1159d9"),
    "frontend bundle is missing the finals credential write hash"
  );
  assert(
    bundleText.includes("e84e316b075fd257f42e91229cdf7762f8089993b01ea64f5e989303360886f6"),
    "frontend bundle is missing the execution-intent write hash"
  );

  return "Frontend bundle includes finals deploy, credential write, and execution-intent proof.";
}

async function exerciseApi() {
  const server = spawn(process.execPath, ["apps/api/dist/server.js"], {
    cwd: root,
    env: {
      ...process.env,
      CASPER_MODE: "mock",
      PORT: String(apiPort)
    },
    stdio: ["ignore", "pipe", "pipe"]
  });

  let serverOutput = "";
  server.stdout.on("data", (chunk) => {
    serverOutput += chunk.toString();
  });
  server.stderr.on("data", (chunk) => {
    serverOutput += chunk.toString();
  });

  try {
    await waitForHealth();
    const reportResponse = await fetch(`http://127.0.0.1:${apiPort}/api/reports`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assetName: "Acme Invoice Batch A",
        assetType: "invoice",
        requestedAmountUsd: 125000,
        maturityDays: 45,
        debtorName: "Acme Manufacturing",
        debtorCountry: "US",
        description:
          "Thirty invoices from a recurring industrial buyer with public purchase-order references and predictable 45-day repayment behavior.",
        publicEvidenceUrls: ["https://example.com/invoice-a", "https://example.com/purchase-order-a"]
      })
    });

    assert(reportResponse.ok, `POST /api/reports returned ${reportResponse.status}`);
    const credential = await reportResponse.json();
    assert(credential.report?.assetId === "invoice:acme-invoice-batch-a", "report assetId mismatch");
    assert(typeof credential.report?.riskScore === "number", "riskScore missing");
    assert(credential.report?.reportHash, "reportHash missing");
    assert(credential.report?.evidenceHash, "evidenceHash missing");
    assert(credential.attestation?.transactionHash?.startsWith("mock-"), "mock transaction hash missing");
    assert(credential.registryCall?.entryPoint === "record_credential", "registry call entry point missing");
    assert(
      credential.registryCall?.args?.asset_id === "invoice:acme-invoice-batch-a",
      "registry call asset_id mismatch"
    );

    const registryResponse = await fetch(`http://127.0.0.1:${apiPort}/api/credentials`);
    assert(registryResponse.ok, `GET /api/credentials returned ${registryResponse.status}`);
    const registry = await registryResponse.json();
    assert(Array.isArray(registry.credentials), "credentials registry is not an array");
    assert(registry.credentials.length >= 1, "credentials registry is empty after report creation");

    const executionResponse = await fetch(`http://127.0.0.1:${apiPort}/api/execution/evaluate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assetId: credential.report.assetId,
        context: {
          mode: "autonomous",
          collateralRatio: 1.36,
          proposedAdvanceRatePercent: 68,
          liquidityBufferPercent: 31,
          evidenceFreshness: 92,
          credentialVerified: true,
          reportHashVerified: true,
          covenantBreach: false
        }
      })
    });
    assert(executionResponse.ok, `POST /api/execution/evaluate returned ${executionResponse.status}`);
    const execution = await executionResponse.json();
    assert(execution.evaluation?.checks?.length === 9, "execution policy must expose nine checks");
    assert(execution.evaluation?.principalCapUsd > 0, "execution principal cap is missing");

    const anchorResponse = await fetch(`http://127.0.0.1:${apiPort}/api/execution/anchor`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intentId: execution.evaluation.intent.intentId })
    });
    assert(anchorResponse.ok, `POST /api/execution/anchor returned ${anchorResponse.status}`);
    const anchored = await anchorResponse.json();
    assert(anchored.intentHash?.length === 64, "canonical execution intent hash is missing");
    assert(
      anchored.attestation?.entryPoint === "record_execution_intent",
      "execution intent entry point is missing"
    );
    assert(
      anchored.attestation?.transactionHash?.startsWith("mock-"),
      "mock execution transaction hash is missing"
    );

    const benchmarkResponse = await fetch(`http://127.0.0.1:${apiPort}/api/execution/benchmark`);
    assert(benchmarkResponse.ok, `GET /api/execution/benchmark returned ${benchmarkResponse.status}`);
    const benchmark = await benchmarkResponse.json();
    assert(benchmark.sampleCount === 30, "benchmark sample count must be 30");
    assert(benchmark.agreementRate === 100, "benchmark decision agreement must be 100%");
    assert(benchmark.coveredChecks?.length === 9, "benchmark must cover all nine policy checks");

    return `API produced credential, ${execution.evaluation.decision} intent, and ${anchored.attestation.transactionHash}.`;
  } finally {
    server.kill();
    if (server.exitCode === null) {
      await new Promise((resolve) => server.once("exit", resolve));
    }
    if (serverOutput.trim()) {
      process.stdout.write(serverOutput);
    }
  }
}

async function waitForHealth() {
  const deadline = Date.now() + 15_000;
  let lastError;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${apiPort}/health`);
      if (response.ok) {
        const health = await response.json();
        assert(health.ok === true, "health response ok flag is false");
        return;
      }
    } catch (error) {
      lastError = error;
    }

    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  throw new Error(`API did not become healthy: ${formatError(lastError)}`);
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawnCommand(command, args, {
      cwd: root,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"]
    });
    let output = "";

    child.stdout.on("data", (chunk) => {
      output += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      output += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(`${command} ${args.join(" ")} exited with ${code}\n${output}`));
      }
    });
  });
}

function spawnCommand(command, args, options) {
  if (process.platform !== "win32") {
    return spawn(command, args, options);
  }

  return spawn("cmd.exe", ["/d", "/s", "/c", [command, ...args].join(" ")], options);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function formatError(error) {
  if (!error) {
    return "unknown error";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function printSummary() {
  process.stdout.write("\nVerification summary:\n");
  for (const check of checks) {
    const marker = check.status === "pass" ? "PASS" : check.status === "warn" ? "WARN" : "FAIL";
    process.stdout.write(`- ${marker}: ${check.name}`);
    if (check.details) {
      process.stdout.write(` (${check.details.split("\n")[0]})`);
    }
    process.stdout.write("\n");
  }
}

main().catch((error) => {
  process.stderr.write(`\n[verify] failed: ${formatError(error)}\n`);
  process.exit(1);
});
