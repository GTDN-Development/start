import { spawn } from "node:child_process";
import { rm } from "node:fs/promises";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  createE2EStackConfig,
  LOCAL_POCKETBASE_SUPERUSER_EMAIL,
  LOCAL_POCKETBASE_SUPERUSER_PASSWORD,
  loadWebEnv,
  prepareLocalStack,
  stopLocalStack,
} from "./local-stack.mjs";

const WEB_APP_DIR = fileURLToPath(new URL("../apps/web/", import.meta.url));
const DEFAULT_E2E_APP_PORT = 3100;

async function main() {
  loadWebEnv("test");

  const config = await createE2EStackConfig();
  const appPort = await resolveE2EAppPort(DEFAULT_E2E_APP_PORT);
  const env = createWebAppEnv(config, appPort);
  const playwrightArgs = process.argv.slice(2).filter(function filterArgs(argument) {
    return argument !== "--ui";
  });

  try {
    await prepareLocalStack(config, env);
    await rm(path.join(WEB_APP_DIR, ".next"), {
      force: true,
      recursive: true,
    });
    await runWebCommand(
      ["exec", "node", "./tests/scripts/run-next-with-test-env.cjs", "build"],
      env
    );
    await runWebCommand(
      [
        "exec",
        "playwright",
        "test",
        ...playwrightArgs,
        ...(process.argv.includes("--ui") ? ["--ui"] : []),
        "--pass-with-no-tests",
      ],
      env
    );
  } finally {
    await stopLocalStack(config, { removeVolumes: true });
  }
}

function createWebAppEnv(config, appPort, env = process.env) {
  return {
    ...env,
    PORT: String(appPort),
    MAIL_TRANSPORT: "mailpit-api",
    NEXT_PUBLIC_APP_URL: `http://localhost:${appPort}`,
    NEXT_PUBLIC_PB_URL: config.pbUrl,
    MAILPIT_BASE_URL: config.mailpitUrl,
    PB_SUPERUSER_EMAIL: LOCAL_POCKETBASE_SUPERUSER_EMAIL,
    PB_SUPERUSER_PASSWORD: LOCAL_POCKETBASE_SUPERUSER_PASSWORD,
  };
}

function runWebCommand(args, env) {
  return new Promise(function resolveCommand(resolve, reject) {
    const child = spawn("pnpm", args, {
      cwd: WEB_APP_DIR,
      env,
      stdio: "inherit",
    });

    child.on("error", reject);
    child.on("exit", function handleExit(code, signal) {
      if (signal) {
        reject(new Error(`pnpm ${args.join(" ")} exited with signal ${signal}.`));
        return;
      }

      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`pnpm ${args.join(" ")} exited with status ${code}.`));
    });
  });
}

async function resolveE2EAppPort(fallback) {
  const configuredPort = process.env.PORT?.trim();

  if (configuredPort) {
    return getAppPort(fallback);
  }

  return findAvailablePort(fallback);
}

function getAppPort(fallback) {
  const value = process.env.PORT?.trim();

  if (!value) {
    return fallback;
  }

  const parsedValue = Number.parseInt(value, 10);

  if (Number.isNaN(parsedValue) || parsedValue < 1 || parsedValue > 65_535) {
    throw new Error("PORT must contain a valid TCP port number.");
  }

  return parsedValue;
}

async function findAvailablePort(initialPort, maxAttempts = 20) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const port = initialPort + attempt;

    if (await isLocalhostPortAvailable(port)) {
      return port;
    }
  }

  throw new Error(
    `Unable to find an available TCP port starting from ${initialPort}. Set PORT explicitly to continue.`
  );
}

async function isLocalhostPortAvailable(port) {
  const loopbackHosts = ["127.0.0.1", "::1"];

  for (const host of loopbackHosts) {
    if (await isTcpPortReachable(host, port)) {
      return false;
    }
  }

  return true;
}

function isTcpPortReachable(host, port) {
  return new Promise(function resolveReachability(resolve, reject) {
    const socket = new net.Socket();

    socket.setTimeout(200);

    socket.once("connect", function handleConnect() {
      socket.destroy();
      resolve(true);
    });

    socket.once("timeout", function handleTimeout() {
      socket.destroy();
      resolve(false);
    });

    socket.once("error", function handleError(error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        (error.code === "ECONNREFUSED" ||
          error.code === "EHOSTUNREACH" ||
          error.code === "ENETUNREACH")
      ) {
        resolve(false);
        return;
      }

      reject(error);
    });

    socket.connect(port, host);
  });
}

main().catch(function handleError(error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
