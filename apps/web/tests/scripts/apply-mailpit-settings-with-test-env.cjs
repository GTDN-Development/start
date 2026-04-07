const path = require("node:path");
const { spawn } = require("node:child_process");
const { getProjectRoot, loadTestEnv } = require("../load-test-env.cjs");

main();

function main() {
  loadTestEnv();

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

function forwardSignal(child, signal) {
  process.on(signal, function handleSignal() {
    if (child.killed) {
      return;
    }

    child.kill(signal);
  });
}
