import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const sourceRoot = path.join(repoRoot, "apps", "web", "src");

const domainDefinitions = [
  {
    name: "workspaces",
    includePrefixes: ["features/workspaces/", "server/workspaces/"],
  },
  {
    name: "auth",
    includePrefixes: ["features/auth/", "server/auth/", "server/device-sessions/"],
  },
  {
    name: "account",
    includePrefixes: ["features/account/", "server/account/"],
  },
  {
    name: "application",
    includePrefixes: ["features/application/"],
  },
];

const representativeScenarios = [
  {
    name: "workspace-general-update",
    flow: "settings/page.tsx -> workspace-name/url/avatar-settings-item.tsx -> workspace-navigation-context.tsx -> workspace-general-actions.ts -> workspace-general-service.ts",
    why: "Tracks the current split between route snapshot loading, local workspace patching, and the shared workspace mutation boundary.",
    files: [
      "apps/web/src/app/[locale]/(application)/(application-shell)/w/[workspaceSlug]/settings/page.tsx",
      "apps/web/src/features/workspaces/settings/general/workspace-name-settings-item.tsx",
      "apps/web/src/features/workspaces/settings/general/workspace-url-settings-item.tsx",
      "apps/web/src/features/workspaces/settings/general/workspace-avatar-settings-item.tsx",
      "apps/web/src/features/workspaces/workspace-navigation-context.tsx",
      "apps/web/src/features/workspaces/settings/general/workspace-general-actions.ts",
      "apps/web/src/server/workspaces/workspace-general-service.ts",
    ],
  },
  {
    name: "workspace-membership-change",
    flow: "settings/members/page.tsx -> workspace-members-settings-section.tsx -> invite/management-settings-item.tsx -> workspace-members-actions.ts -> workspace-members-service.ts -> workspace-invite-service.ts",
    why: "Captures the mixed members and invites surface where local list patching and route invalidation currently overlap.",
    files: [
      "apps/web/src/app/[locale]/(application)/(application-shell)/w/[workspaceSlug]/settings/members/page.tsx",
      "apps/web/src/features/workspaces/settings/members/workspace-members-settings-section.tsx",
      "apps/web/src/features/workspaces/settings/members/workspace-members-management-settings-item.tsx",
      "apps/web/src/features/workspaces/settings/members/workspace-invite-members-settings-item.tsx",
      "apps/web/src/features/workspaces/settings/members/workspace-members-actions.ts",
      "apps/web/src/server/workspaces/workspace-members-service.ts",
      "apps/web/src/server/workspaces/workspace-invite-service.ts",
    ],
  },
  {
    name: "account-profile-update",
    flow: "account/page.tsx -> account-profile-context.tsx -> avatar/display-name-settings-item.tsx -> account-profile-actions.ts -> account-profile-service.ts",
    why: "Provides a control case where profile edits already stay client-owned after load without route revalidation.",
    files: [
      "apps/web/src/app/[locale]/(application)/(account-settings)/account/page.tsx",
      "apps/web/src/features/application/application-root.tsx",
      "apps/web/src/features/account/account-profile-context.tsx",
      "apps/web/src/features/account/profile/avatar-settings-item.tsx",
      "apps/web/src/features/account/profile/display-name-settings-item.tsx",
      "apps/web/src/features/account/profile/account-profile-actions.ts",
      "apps/web/src/server/account/account-profile-service.ts",
    ],
  },
  {
    name: "device-session-sign-out",
    flow: "account/security/page.tsx -> account-security-devices-section.tsx -> your-devices-settings-item.tsx -> device-session-actions.ts -> device-sessions-service.ts",
    why: "Provides a second control case for a client-owned interactive list that does not pair local patching with route invalidation.",
    files: [
      "apps/web/src/app/[locale]/(application)/(account-settings)/account/security/page.tsx",
      "apps/web/src/features/account/security/account-security-devices-section.tsx",
      "apps/web/src/features/account/security/your-devices-settings-item.tsx",
      "apps/web/src/features/account/security/device-session-actions.ts",
      "apps/web/src/server/device-sessions/device-sessions-service.ts",
    ],
  },
  {
    name: "workspace-scope-switch",
    flow: "scope-switcher.tsx -> workspace-selection.ts -> workspace-general-actions.ts -> workspace-resolution-service.ts -> workspace-cookie.ts",
    why: "Tracks the navigation boundary where workspace selection crosses client navigation state, action finalization, and active-workspace persistence.",
    files: [
      "apps/web/src/features/application/scope-switcher.tsx",
      "apps/web/src/features/application/workspace-selection.ts",
      "apps/web/src/features/workspaces/settings/general/workspace-general-actions.ts",
      "apps/web/src/server/workspaces/workspace-resolution-service.ts",
      "apps/web/src/server/workspaces/workspace-cookie.ts",
    ],
  },
];

function isSourceFile(relativePath) {
  return (
    (relativePath.endsWith(".ts") || relativePath.endsWith(".tsx")) &&
    !relativePath.includes("/__tests__/") &&
    !relativePath.includes(".test.") &&
    !relativePath.includes(".spec.")
  );
}

function normalizeRelativePath(absolutePath) {
  return path.relative(repoRoot, absolutePath).split(path.sep).join("/");
}

async function collectSourceFiles(directoryPath) {
  const entries = await readdir(directoryPath, { withFileTypes: true });
  const filePaths = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directoryPath, entry.name);

      if (entry.isDirectory()) {
        return collectSourceFiles(entryPath);
      }

      return entryPath;
    })
  );

  return filePaths.flat().filter(Boolean);
}

function countLines(text) {
  if (text.length === 0) {
    return 0;
  }

  const newlineCount = (text.match(/\n/g) ?? []).length;

  return newlineCount + (text.endsWith("\n") ? 0 : 1);
}

function formatCodeList(values) {
  return values.map((value) => `\`${value}\``).join(", ");
}

function createMarkdownTable(headers, rows) {
  const separatorRow = headers.map((header) => (header.endsWith(":") ? "---:" : "---"));
  const normalizedHeaders = headers.map((header) => header.replace(/:$/, ""));
  const lines = [
    `| ${normalizedHeaders.join(" | ")} |`,
    `| ${separatorRow.join(" | ")} |`,
    ...rows.map((row) => `| ${row.join(" | ")} |`),
  ];

  return lines.join("\n");
}

async function measureDomain(relativePaths, definition) {
  const matchedFiles = relativePaths.filter((relativePath) =>
    definition.includePrefixes.some((prefix) => relativePath.startsWith(prefix))
  );

  const lineCounts = await Promise.all(
    matchedFiles.map(async (relativePath) => {
      const absolutePath = path.join(sourceRoot, relativePath);
      const contents = await readFile(absolutePath, "utf8");

      return countLines(contents);
    })
  );

  return {
    name: definition.name,
    includePrefixes: definition.includePrefixes,
    fileCount: matchedFiles.length,
    loc: lineCounts.reduce((total, count) => total + count, 0),
  };
}

async function assertScenarioFilesExist() {
  await Promise.all(
    representativeScenarios.flatMap((scenario) =>
      scenario.files.map(async (relativePath) => {
        const absolutePath = path.join(repoRoot, relativePath);
        await readFile(absolutePath, "utf8");
      })
    )
  );
}

async function main() {
  const absoluteFilePaths = await collectSourceFiles(sourceRoot);
  const relativeSourcePaths = absoluteFilePaths
    .map((absolutePath) => normalizeRelativePath(absolutePath))
    .filter((relativePath) => isSourceFile(relativePath))
    .map((relativePath) => relativePath.replace(/^apps\/web\/src\//, ""))
    .sort();

  await assertScenarioFilesExist();

  const domainMetrics = await Promise.all(
    domainDefinitions.map((definition) => measureDomain(relativeSourcePaths, definition))
  );

  const domainRows = domainMetrics.map((metric) => [
    `\`${metric.name}\``,
    formatCodeList(metric.includePrefixes.map((prefix) => `apps/web/src/${prefix}**`)),
    String(metric.fileCount),
    String(metric.loc),
  ]);

  const scenarioRows = representativeScenarios.map((scenario) => [
    `\`${scenario.name}\``,
    String(new Set(scenario.files).size),
    scenario.flow,
    scenario.why,
  ]);

  const markdown = [
    "Generated by `pnpm coordination-tax:baseline`.",
    "",
    "Source scope: `apps/web/src/**/*.{ts,tsx}`.",
    "",
    "Domain metrics exclude tests by rule and stay limited to the four Phase 0 buckets.",
    "",
    "## Domain Metrics",
    "",
    createMarkdownTable(["Domain", "Included paths", "File count:", "LOC:"], domainRows),
    "",
    "## Representative Changes",
    "",
    createMarkdownTable(["Scenario", "Touch count:", "Current path", "Why tracked"], scenarioRows),
  ].join("\n");

  process.stdout.write(`${markdown}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
