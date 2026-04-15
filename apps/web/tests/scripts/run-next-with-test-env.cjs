const { spawn } = require("node:child_process");
const { loadTestEnv } = require("../load-test-env.cjs");

const nextBinPath = require.resolve("next/dist/bin/next");

main();

function main() {
  loadTestEnv();

  const mode = process.argv[2];

  if (mode !== "build" && mode !== "start") {
    console.error('Unsupported mode. Use "build" or "start".');
    process.exit(1);
  }

  if (mode === "start" && !process.env.PORT) {
    process.env.PORT = "3100";
  }

  const child = spawn(process.execPath, [nextBinPath, ...getNextArgs(mode)], {
    stdio: "inherit",
    env: process.env,
  });

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

function getNextArgs(mode) {
  if (mode === "build") {
    return ["build"];
  }

  return ["start"];
}

function forwardSignal(child, signal) {
  process.on(signal, function handleSignal() {
    if (child.killed) {
      return;
    }

    child.kill(signal);
  });
}
