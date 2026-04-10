import assert from "node:assert/strict";
import { execFile as execFileCallback, spawn } from "node:child_process";
import { access, chmod, mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { createServer } from "node:net";
import { dirname, join, resolve } from "node:path";
import { homedir, tmpdir } from "node:os";
import { setTimeout as delay } from "node:timers/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFile = promisify(execFileCallback);

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const APP_DIR = resolve(SCRIPT_DIR, "..");
const DOCKERFILE_PATH = join(APP_DIR, "Dockerfile");
const HOOKS_DIR = join(APP_DIR, "pb_hooks");
const MIGRATIONS_DIR = join(APP_DIR, "pb_migrations");
const PUBLIC_DIR = join(APP_DIR, "pb_public");
const LOCAL_BINARY_PATH = join(APP_DIR, "pocketbase");

test(
  "PocketBase boots from committed migrations and hooks",
  {
    timeout: 120_000,
  },
  async function testPocketBaseStartupSmoke() {
    const binaryPath = await resolvePocketBaseBinary();
    const tempDir = await mkdtemp(join(tmpdir(), "start-pocketbase-smoke-"));
    const dataDir = join(tempDir, "pb_data");
    const port = await reserveFreePort();

    try {
      await mkdir(dataDir, { recursive: true });

      await runCommand(binaryPath, [
        "migrate",
        "up",
        `--dir=${dataDir}`,
        `--migrationsDir=${MIGRATIONS_DIR}`,
      ]);

      const server = spawn(
        binaryPath,
        [
          "serve",
          `--http=127.0.0.1:${port}`,
          `--dir=${dataDir}`,
          `--hooksDir=${HOOKS_DIR}`,
          `--migrationsDir=${MIGRATIONS_DIR}`,
          `--publicDir=${PUBLIC_DIR}`,
          "--automigrate=false",
        ],
        {
          cwd: APP_DIR,
          stdio: ["ignore", "pipe", "pipe"],
        }
      );

      const logs = captureProcessOutput(server);

      try {
        await waitForHealth(port, server, logs);

        const inviteInspectResponse = await fetch(
          `http://127.0.0.1:${port}/api/start/workspace-invites/inspect`,
          {
            method: "POST",
            headers: {
              "content-type": "application/json",
            },
            body: "{}",
          }
        );

        assert.equal(inviteInspectResponse.status, 400);

        const inviteInspectBody = await inviteInspectResponse.json();

        assert.equal(inviteInspectBody.message, "Missing invite token.");
      } finally {
        await stopProcess(server);
      }
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  }
);

async function resolvePocketBaseBinary() {
  if (process.env.POCKETBASE_BIN) {
    await assertExecutableFile(process.env.POCKETBASE_BIN);
    return process.env.POCKETBASE_BIN;
  }

  if (await fileExists(LOCAL_BINARY_PATH)) {
    await assertExecutableFile(LOCAL_BINARY_PATH);
    return LOCAL_BINARY_PATH;
  }

  return downloadPocketBaseBinary(await resolvePocketBaseVersion());
}

async function resolvePocketBaseVersion() {
  const dockerfile = await readFile(DOCKERFILE_PATH, "utf8");
  const versionMatch = dockerfile.match(/^ARG PB_VERSION=(.+)$/m);

  if (!versionMatch?.[1]) {
    throw new Error("Failed to resolve PocketBase version from Dockerfile.");
  }

  return versionMatch[1].trim();
}

async function downloadPocketBaseBinary(version) {
  const target = resolvePocketBaseTarget(process.platform, process.arch);
  const cacheDir = join(
    homedir(),
    ".cache",
    "start-pocketbase",
    `v${version}`,
    `${process.platform}-${process.arch}`
  );
  const binaryPath = join(cacheDir, "pocketbase");

  if (await fileExists(binaryPath)) {
    await chmod(binaryPath, 0o755);
    return binaryPath;
  }

  await mkdir(cacheDir, { recursive: true });

  const archiveUrl =
    `https://github.com/pocketbase/pocketbase/releases/download/v${version}/` +
    `pocketbase_${version}_${target}.zip`;
  const archivePath = join(cacheDir, `pocketbase_${version}_${target}.zip`);
  const response = await fetch(archiveUrl);

  if (!response.ok) {
    throw new Error(`Failed to download PocketBase ${version} from ${archiveUrl}`);
  }

  const archiveBytes = Buffer.from(await response.arrayBuffer());
  await writeFile(archivePath, archiveBytes);

  try {
    await execFile("unzip", ["-o", archivePath, "-d", cacheDir], {
      cwd: cacheDir,
      timeout: 60_000,
    });
  } catch (error) {
    throw new Error(`Failed to extract PocketBase archive: ${formatCommandError(error)}`);
  }

  await chmod(binaryPath, 0o755);

  return binaryPath;
}

function resolvePocketBaseTarget(platform, arch) {
  if (platform === "darwin" && arch === "arm64") {
    return "darwin_arm64";
  }

  if (platform === "darwin" && arch === "x64") {
    return "darwin_amd64";
  }

  if (platform === "linux" && arch === "arm64") {
    return "linux_arm64";
  }

  if (platform === "linux" && arch === "x64") {
    return "linux_amd64";
  }

  throw new Error(`Unsupported platform for PocketBase smoke test: ${platform} ${arch}`);
}

async function runCommand(command, args) {
  try {
    await execFile(command, args, {
      cwd: APP_DIR,
      timeout: 60_000,
    });
  } catch (error) {
    throw new Error(formatCommandError(error));
  }
}

function captureProcessOutput(childProcess) {
  let stdout = "";
  let stderr = "";

  childProcess.stdout?.on("data", function onStdout(chunk) {
    stdout += String(chunk);
  });
  childProcess.stderr?.on("data", function onStderr(chunk) {
    stderr += String(chunk);
  });

  return {
    getCombined() {
      return [stdout.trim(), stderr.trim()].filter(Boolean).join("\n");
    },
  };
}

async function waitForHealth(port, childProcess, logs) {
  const healthUrl = `http://127.0.0.1:${port}/api/health`;
  const deadline = Date.now() + 15_000;

  while (Date.now() < deadline) {
    if (childProcess.exitCode !== null) {
      throw new Error(
        `PocketBase exited before becoming healthy.\n${logs.getCombined() || "No process output."}`
      );
    }

    try {
      const response = await fetch(healthUrl, {
        signal: AbortSignal.timeout(1_000),
      });

      if (response.ok) {
        return;
      }
    } catch {}

    await delay(250);
  }

  throw new Error(`PocketBase did not become healthy in time.\n${logs.getCombined()}`);
}

async function stopProcess(childProcess) {
  if (childProcess.exitCode !== null) {
    return;
  }

  childProcess.kill("SIGINT");

  const exited = await Promise.race([
    new Promise((resolveExit) => {
      childProcess.once("exit", resolveExit);
    }),
    delay(5_000).then(() => false),
  ]);

  if (exited === false && childProcess.exitCode === null) {
    childProcess.kill("SIGKILL");
    await new Promise((resolveExit) => {
      childProcess.once("exit", resolveExit);
    });
  }
}

async function reserveFreePort() {
  return new Promise((resolvePort, rejectPort) => {
    const server = createServer();

    server.once("error", rejectPort);
    server.listen(0, "127.0.0.1", function onListen() {
      const address = server.address();

      if (!address || typeof address === "string") {
        server.close();
        rejectPort(new Error("Failed to reserve a local port for PocketBase smoke test."));
        return;
      }

      const { port } = address;

      server.close(function onClose(closeError) {
        if (closeError) {
          rejectPort(closeError);
          return;
        }

        resolvePort(port);
      });
    });
  });
}

async function assertExecutableFile(path) {
  await access(path, constants.X_OK);
}

async function fileExists(path) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function formatCommandError(error) {
  if (!(error instanceof Error)) {
    return String(error);
  }

  const stdout = typeof error.stdout === "string" ? error.stdout.trim() : "";
  const stderr = typeof error.stderr === "string" ? error.stderr.trim() : "";
  const details = [error.message, stdout, stderr].filter(Boolean);

  return details.join("\n");
}
