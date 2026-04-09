import net from "node:net";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const DEFAULT_PORTS = {
  pocketbase: 8090,
  mailpitHttp: 8025,
  mailpitSmtp: 1025,
};

export const LOCAL_POCKETBASE_SUPERUSER_EMAIL = "local-admin@example.com";
export const LOCAL_POCKETBASE_SUPERUSER_PASSWORD = "local-dev-password";

const STACK_READY_TIMEOUT_MS = 90_000;
const POLL_INTERVAL_MS = 1_000;
const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..");
const COMPOSE_FILE_PATH = path.join(REPO_ROOT, "compose.yaml");

export function createDevStackConfig(env = process.env) {
  return createStackConfig({
    projectName: "start-dev",
    pbPort: readPort(env.POCKETBASE_PORT, DEFAULT_PORTS.pocketbase, "POCKETBASE_PORT"),
    mailpitHttpPort: readPort(
      env.MAILPIT_HTTP_PORT,
      DEFAULT_PORTS.mailpitHttp,
      "MAILPIT_HTTP_PORT"
    ),
    mailpitSmtpPort: readPort(
      env.MAILPIT_SMTP_PORT,
      DEFAULT_PORTS.mailpitSmtp,
      "MAILPIT_SMTP_PORT"
    ),
  });
}

export async function createE2EStackConfig() {
  const [pbPort, mailpitHttpPort, mailpitSmtpPort] = await Promise.all([
    findFreePort(),
    findFreePort(),
    findFreePort(),
  ]);

  return createStackConfig({
    projectName: `start-e2e-${Date.now().toString(36)}`,
    pbPort,
    mailpitHttpPort,
    mailpitSmtpPort,
  });
}

export async function prepareLocalStack(config, env = process.env) {
  assertDockerCompose();

  const composeEnv = createComposeEnv(config, env);

  try {
    await run("docker", ["compose", "--file", COMPOSE_FILE_PATH, "up", "-d", "--build"], {
      cwd: REPO_ROOT,
      env: composeEnv,
    });

    await Promise.all([
      waitUntilOk(`${config.pbUrl}/api/health`, "PocketBase"),
      waitUntilOk(`${config.mailpitUrl}/readyz`, "Mailpit"),
    ]);

    await run("pnpm", ["--filter", "@start/pocketbase", "run", "mailpit:apply"], {
      cwd: REPO_ROOT,
      env,
    });
  } catch (error) {
    await run("docker", ["compose", "--file", COMPOSE_FILE_PATH, "logs", "--tail", "100"], {
      cwd: REPO_ROOT,
      env: composeEnv,
      allowFailure: true,
    });
    throw error;
  }
}

export async function stopLocalStack(config, options = {}) {
  await run(
    "docker",
    [
      "compose",
      "--file",
      COMPOSE_FILE_PATH,
      "down",
      "--remove-orphans",
      ...(options.removeVolumes ? ["-v"] : []),
    ],
    {
      cwd: REPO_ROOT,
      env: createComposeEnv(config),
      allowFailure: true,
    }
  );
}

function createStackConfig(config) {
  return {
    ...config,
    pbUrl: `http://127.0.0.1:${config.pbPort}`,
    mailpitUrl: `http://127.0.0.1:${config.mailpitHttpPort}`,
  };
}

function createComposeEnv(config, env = process.env) {
  return {
    ...env,
    COMPOSE_PROJECT_NAME: config.projectName,
    POCKETBASE_PORT: String(config.pbPort),
    MAILPIT_HTTP_PORT: String(config.mailpitHttpPort),
    MAILPIT_SMTP_PORT: String(config.mailpitSmtpPort),
    PB_SUPERUSER_EMAIL: LOCAL_POCKETBASE_SUPERUSER_EMAIL,
    PB_SUPERUSER_PASSWORD: LOCAL_POCKETBASE_SUPERUSER_PASSWORD,
  };
}

function assertDockerCompose() {
  const result = spawnSync("docker", ["compose", "version"], {
    cwd: REPO_ROOT,
    stdio: "ignore",
  });

  if (result.status === 0) {
    return;
  }

  throw new Error("Docker with Compose is required for the local PocketBase + Mailpit stack.");
}

function readPort(value, fallback, envName) {
  if (!value?.trim()) {
    return fallback;
  }

  const parsedValue = Number.parseInt(value, 10);

  if (Number.isNaN(parsedValue) || parsedValue < 1 || parsedValue > 65_535) {
    throw new Error(`${envName} must contain a valid TCP port number.`);
  }

  return parsedValue;
}

function findFreePort() {
  return new Promise(function resolveFreePort(resolve, reject) {
    const server = net.createServer();

    server.unref();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", function handleListen() {
      const address = server.address();

      if (!address || typeof address === "string") {
        server.close(function closeAfterFailure() {
          reject(new Error("Unable to reserve a free port."));
        });
        return;
      }

      server.close(function closeAfterSuccess(closeError) {
        if (closeError) {
          reject(closeError);
          return;
        }

        resolve(address.port);
      });
    });
  });
}

async function waitUntilOk(url, label) {
  const deadline = Date.now() + STACK_READY_TIMEOUT_MS;

  while (Date.now() <= deadline) {
    try {
      const response = await fetch(url);

      if (response.ok) {
        return;
      }
    } catch {
      // Wait until the container becomes reachable.
    }

    await new Promise(function resolveAfterTimeout(resolve) {
      setTimeout(resolve, POLL_INTERVAL_MS);
    });
  }

  throw new Error(`${label} did not become ready in time at ${url}.`);
}

function run(command, args, options = {}) {
  return new Promise(function resolveCommand(resolve, reject) {
    const child = spawn(command, args, {
      cwd: options.cwd ?? REPO_ROOT,
      env: options.env ?? process.env,
      stdio: "inherit",
    });

    child.on("error", reject);
    child.on("exit", function handleExit(code, signal) {
      if (signal) {
        reject(new Error(`${command} ${args.join(" ")} exited with signal ${signal}.`));
        return;
      }

      if (code === 0 || options.allowFailure) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(" ")} exited with status ${code}.`));
    });
  });
}
