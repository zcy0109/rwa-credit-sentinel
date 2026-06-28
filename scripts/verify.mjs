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
  await step("Check Risk Registry contract source", checkContractSource);
  await step("Check built frontend includes registry path", checkFrontendBundle);
  await step("Exercise API report and credential registry", exerciseApi);
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
  for (const token of ["record_credential", "get_credential", "owner", "records"]) {
    assert(source.includes(token), `Contract source does not include ${token}`);
  }

  return "Risk Registry contract source contains write/read/owner entry points.";
}

function checkFrontendBundle() {
  const assetsDir = join(root, "apps", "web", "dist", "assets");
  assert(existsSync(assetsDir), "web dist assets are missing; run build first");

  const jsFiles = readdirSync(assetsDir).filter((file) => file.endsWith(".js"));
  assert(jsFiles.length > 0, "web dist bundle is missing JavaScript assets");

  const bundleText = jsFiles.map((file) => readFileSync(join(assetsDir, file), "utf8")).join("\n");
  assert(bundleText.includes("Casper Registry Path"), "frontend bundle is missing Casper Registry Path");
  assert(bundleText.includes("record_credential"), "frontend bundle is missing record_credential");
  assert(bundleText.includes("Verified Casper Evidence"), "frontend bundle is missing Casper proof strip");
  assert(
    bundleText.includes("735dab5995084abfe4494398ff6f3c6677055a4d5025b79918ae9c4a202a93b9"),
    "frontend bundle is missing the real Casper contract deployment hash"
  );
  assert(
    bundleText.includes("096907b2961fe30d01d0267a2876922225d2b43e37f124a40608330e500341f0"),
    "frontend bundle is missing the real Casper registry write hash"
  );
  assert(
    bundleText.includes("aeda10dacdee9cefa8b857c3f6c8a0b2edeb6c19421f16189016ab1a2359b391"),
    "frontend bundle is missing the deployed contract hash"
  );

  return "Frontend bundle includes contract deployment, registry write, and registry path proof.";
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

    return `API produced ${credential.report.decision} credential ${credential.attestation.transactionHash}.`;
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
