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
import PocketBase from "pocketbase";

const execFile = promisify(execFileCallback);

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const APP_DIR = resolve(SCRIPT_DIR, "..");
const DOCKERFILE_PATH = join(APP_DIR, "Dockerfile");
const HOOKS_DIR = join(APP_DIR, "pb_hooks");
const MIGRATIONS_DIR = join(APP_DIR, "pb_migrations");
const PUBLIC_DIR = join(APP_DIR, "pb_public");
const LOCAL_BINARY_PATH = join(APP_DIR, "pocketbase");
const COLLECTIONS_SNAPSHOT_PATH = join(MIGRATIONS_DIR, "1774467906_collections_snapshot.js");
const TEST_SUPERUSER_EMAIL = "startup-smoke-admin@example.com";
const TEST_SUPERUSER_PASSWORD = "startup-smoke-password";

test("Dockerfile pins the current PocketBase release", async function testDockerfileVersion() {
  const dockerfile = await readFile(DOCKERFILE_PATH, "utf8");

  assert.match(dockerfile, /^ARG PB_VERSION=0\.38\.0$/m);
});

test("committed posts snapshot exposes only published posts publicly", async function testPostsSnapshotRules() {
  const snapshot = await readFile(COLLECTIONS_SNAPSHOT_PATH, "utf8");

  assert.match(
    snapshot,
    /listRule: 'status = "published"',\n\s+name: "posts",/,
    "posts listRule must only expose published posts"
  );
  assert.match(
    snapshot,
    /name: "posts",[\s\S]*?viewRule: 'status = "published"',/,
    "posts viewRule must only expose published posts"
  );
});

test("committed snapshot applies production readiness defaults", async function testProductionReadinessDefaults() {
  const snapshot = await readFile(COLLECTIONS_SNAPSHOT_PATH, "utf8");

  assert.match(snapshot, /settings\.rateLimits\.enabled = true/);
  assert.match(
    snapshot,
    /label: "users:authWithPassword",\n\s+audience: "@guest",\n\s+maxRequests: 60,\n\s+duration: 60,/
  );
  assert.match(
    snapshot,
    /label: "\*:requestPasswordReset",\n\s+audience: "@guest",\n\s+maxRequests: 3,\n\s+duration: 300,/
  );
  assert.match(
    snapshot,
    /label: "\*:requestVerification",\n\s+audience: "@guest",\n\s+maxRequests: 3,\n\s+duration: 300,/
  );
  assert.match(
    snapshot,
    /label: "\*:create",\n\s+audience: "@guest",\n\s+maxRequests: 20,\n\s+duration: 60,/
  );
  assert.match(
    snapshot,
    /label: "\/api\/",\n\s+audience: "",\n\s+maxRequests: 300,\n\s+duration: 60,/
  );
  assert.match(
    snapshot,
    /label: "POST \/api\/start\/organization-invites\/inspect",\n\s+audience: "@guest",\n\s+maxRequests: 30,\n\s+duration: 60,/
  );
  assert.match(
    snapshot,
    /id: "file376926767",\n\s+maxSelect: 1,\n\s+maxSize: 5242880,\n\s+mimeTypes: \["image\/jpeg", "image\/png", "image\/webp"\],\n\s+name: "avatar",/,
    "users avatar uploads must have a 5 MB server-side limit"
  );
  assert.match(
    snapshot,
    /id: "file376926767",\n\s+maxSelect: 1,\n\s+maxSize: 5242880,\n\s+mimeTypes: \["image\/png", "image\/jpeg", "image\/webp"\],\n\s+name: "avatar",/,
    "organization avatar uploads must have a 5 MB server-side limit"
  );
});

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
      await runCommand(binaryPath, [
        "superuser",
        "upsert",
        TEST_SUPERUSER_EMAIL,
        TEST_SUPERUSER_PASSWORD,
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
          `http://127.0.0.1:${port}/api/start/organization-invites/inspect`,
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

        await assertOrganizationCreateHook(port);
        await assertOrganizationMemberAuthzHooks(port);
        await assertLastOwnerGuards(port);
      } finally {
        await stopProcess(server);
      }
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  }
);

async function assertOrganizationCreateHook(port) {
  const pb = await createSuperuserClient(port);

  const suffix = Math.random().toString(16).slice(2, 10);
  const creator = await createVerifiedUserClient(port, pb, `organization-create-${suffix}`);

  const organizationResponse = await creator.client.send("/api/start/organizations", {
    method: "POST",
    body: {
      name: `Příliš žluťoučký ${suffix}`,
    },
  });

  assert.match(organizationResponse.organization.slug, /^prilis-zlutoucky-[a-f0-9]{8}$/);
  assert.equal(organizationResponse.organization.role, "owner");

  const memberships = await pb.collection("organization_members").getFullList({
    filter: pb.filter("organization = {:organizationId} && user = {:userId}", {
      organizationId: organizationResponse.organization.id,
      userId: creator.user.id,
    }),
  });

  assert.equal(memberships.length, 1);
  assert.equal(memberships[0].role, "owner");
}

async function assertOrganizationMemberAuthzHooks(port) {
  const pb = await createSuperuserClient(port);
  const suffix = Math.random().toString(16).slice(2, 10);
  const owner = await createVerifiedUserClient(port, pb, `authz-owner-${suffix}`);
  const admin = await createVerifiedUserClient(port, pb, `authz-admin-${suffix}`);
  const firstMember = await createVerifiedUserClient(port, pb, `authz-member-a-${suffix}`);
  const secondMember = await createVerifiedUserClient(port, pb, `authz-member-b-${suffix}`);

  const organization = await createOrganizationWithOwner(pb, owner.user, `authz-${suffix}`);
  const adminMembership = await createOrganizationMembership(
    pb,
    organization.id,
    admin.user.id,
    "admin"
  );
  const firstMemberMembership = await createOrganizationMembership(
    pb,
    organization.id,
    firstMember.user.id,
    "member"
  );
  const secondMemberMembership = await createOrganizationMembership(
    pb,
    organization.id,
    secondMember.user.id,
    "member"
  );

  const promotedMember = await admin.client
    .collection("organization_members")
    .update(firstMemberMembership.id, {
      role: "admin",
    });

  assert.equal(promotedMember.role, "admin");

  await assertRejectsWithStatus(
    admin.client.collection("organization_members").update(secondMemberMembership.id, {
      role: "owner",
    }),
    404
  );
  await assertRejectsWithStatus(
    admin.client.collection("organization_members").update(adminMembership.id, {
      role: "owner",
    }),
    404
  );
  await assertRejectsWithStatus(
    secondMember.client.collection("organization_members").update(firstMemberMembership.id, {
      role: "member",
    }),
    404
  );

  await admin.client.collection("organization_members").delete(secondMemberMembership.id);
  await assertRejectsWithStatus(
    pb.collection("organization_members").getOne(secondMemberMembership.id),
    404
  );
}

async function assertLastOwnerGuards(port) {
  const pb = await createSuperuserClient(port);
  const suffix = Math.random().toString(16).slice(2, 10);
  const soloOwner = await createVerifiedUserClient(port, pb, `solo-owner-${suffix}`);
  const firstOwner = await createVerifiedUserClient(port, pb, `multi-owner-a-${suffix}`);
  const secondOwner = await createVerifiedUserClient(port, pb, `multi-owner-b-${suffix}`);

  const soloOrganization = await createOrganizationWithOwner(pb, soloOwner.user, `solo-${suffix}`);
  const soloMembership = await findOrganizationMembership(
    pb,
    soloOrganization.id,
    soloOwner.user.id
  );

  await assertRejectsWithStatus(
    soloOwner.client.collection("organization_members").delete(soloMembership.id),
    400
  );
  await assertRejectsWithStatus(
    soloOwner.client.collection("users").delete(soloOwner.user.id),
    400
  );

  const multiOwnerOrganization = await createOrganizationWithOwner(
    pb,
    firstOwner.user,
    `multi-owner-${suffix}`
  );
  const firstOwnerMembership = await findOrganizationMembership(
    pb,
    multiOwnerOrganization.id,
    firstOwner.user.id
  );
  await createOrganizationMembership(pb, multiOwnerOrganization.id, secondOwner.user.id, "owner");

  await firstOwner.client.collection("organization_members").delete(firstOwnerMembership.id);

  const remainingOwners = await pb.collection("organization_members").getFullList({
    filter: pb.filter("organization = {:organizationId} && role = 'owner'", {
      organizationId: multiOwnerOrganization.id,
    }),
  });

  assert.equal(remainingOwners.length, 1);
  assert.equal(remainingOwners[0].user, secondOwner.user.id);
}

async function createSuperuserClient(port) {
  const pb = new PocketBase(`http://127.0.0.1:${port}`);
  pb.autoCancellation(false);

  await pb
    .collection("_superusers")
    .authWithPassword(TEST_SUPERUSER_EMAIL, TEST_SUPERUSER_PASSWORD);

  return pb;
}

async function createVerifiedUserClient(port, pb, slug) {
  const password = "test-password-123456";
  const email = `${slug}@example.com`;
  const user = await pb.collection("users").create({
    email,
    password,
    passwordConfirm: password,
    name: slug,
    verified: true,
  });
  const client = await pb.collection("users").impersonate(user.id, 3600);
  client.autoCancellation(false);

  return {
    client,
    user,
  };
}

async function createOrganizationWithOwner(pb, user, slug) {
  const organization = await pb.collection("organizations").create({
    name: `Organization ${slug}`,
    slug,
    kind: "organization",
    created_by: user.id,
  });

  await createOrganizationMembership(pb, organization.id, user.id, "owner");

  return organization;
}

async function createOrganizationMembership(pb, organizationId, userId, role) {
  return pb.collection("organization_members").create({
    organization: organizationId,
    user: userId,
    role,
  });
}

async function findOrganizationMembership(pb, organizationId, userId) {
  return pb.collection("organization_members").getFirstListItem(
    pb.filter("organization = {:organizationId} && user = {:userId}", {
      organizationId,
      userId,
    })
  );
}

async function assertRejectsWithStatus(promise, status) {
  await assert.rejects(promise, function matchesStatus(error) {
    return error?.status === status;
  });
}

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
