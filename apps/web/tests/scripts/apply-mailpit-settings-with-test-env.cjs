const path = require("node:path");
const { spawn } = require("node:child_process");
const { getProjectRoot, loadTestEnv } = require("../load-test-env.cjs");

main();

function main() {
  loadTestEnv();
  assertMailpitE2EEnv();

  const pnpmExecPath = process.env.npm_execpath;

  if (!pnpmExecPath) {
    console.error("Unable to determine pnpm executable path from npm_execpath.");
    process.exit(1);
  }

  const repoRoot = path.resolve(getProjectRoot(), "..", "..");
  const child = spawn(
    process.execPath,
    [pnpmExecPath, "--dir", repoRoot, "pocketbase:mailpit:apply"],
    {
      stdio: "inherit",
      env: process.env,
    }
  );

  forwardSignal(child, "SIGINT");
  forwardSignal(child, "SIGTERM");

  child.on("exit", function handleChildExit(code, signal) {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 1);
  });
}

function assertMailpitE2EEnv() {
  const mailTransport = process.env.MAIL_TRANSPORT?.trim().toLowerCase() ?? "";

  if (mailTransport !== "mailpit-api") {
    console.error(
      'E2E requires MAIL_TRANSPORT="mailpit-api" in apps/web/.env.test so workspace invite emails use Mailpit Send API.'
    );
    process.exit(1);
  }

  const requiredMailpitEnvNames = [
    "MAILPIT_BASE_URL",
    "MAILPIT_UI_USERNAME",
    "MAILPIT_UI_PASSWORD",
    "MAILPIT_SEND_API_USERNAME",
    "MAILPIT_SEND_API_PASSWORD",
  ];

  for (const envName of requiredMailpitEnvNames) {
    if (!process.env[envName]?.trim()) {
      console.error(`E2E requires ${envName} in apps/web/.env.test.`);
      process.exit(1);
    }
  }
}

function forwardSignal(child, signal) {
  process.on(signal, function handleSignal() {
    if (child.killed) {
      return;
    }

    child.kill(signal);
  });
}
