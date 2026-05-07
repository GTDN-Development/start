import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const sourceRoot = path.join(repoRoot, "apps", "web", "src");

const domainDefinitions = [
  {
    name: "organizations",
    includePrefixes: ["features/organizations/", "server/organizations/"],
  },
  {
    name: "auth",
    includePrefixes: ["features/auth/", "server/auth/"],
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
    name: "organization-general-update",
    flow: "organization-general-settings-section.tsx -> organization-text-settings-item.tsx -> organization-general-actions.ts",
    why: "Tracks the concrete organization slug update path after route handoff into the general-settings owner.",
    files: [
      "apps/web/src/features/organizations/settings/general/organization-general-settings-section.tsx",
      "apps/web/src/features/organizations/settings/general/organization-text-settings-item.tsx",
      "apps/web/src/features/organizations/settings/general/organization-general-actions.ts",
    ],
  },
  {
    name: "organization-membership-change",
    flow: "organization-members-settings-section.tsx -> organization-members-table.tsx -> organization-members-actions.ts",
    why: "Tracks the concrete member-role and member-removal path through the single members screen owner.",
    files: [
      "apps/web/src/features/organizations/settings/members/organization-members-settings-section.tsx",
      "apps/web/src/features/organizations/settings/members/organization-members-table.tsx",
      "apps/web/src/features/organizations/settings/members/organization-members-actions.ts",
    ],
  },
  {
    name: "account-profile-update",
    flow: "account-profile-context.tsx -> display-name-settings-item.tsx -> account-profile-actions.ts -> account-profile-service.ts",
    why: "Provides a control case where one shared profile snapshot boundary still fronts the concrete display-name mutation path.",
    files: [
      "apps/web/src/features/account/account-profile-context.tsx",
      "apps/web/src/features/account/profile/display-name-settings-item.tsx",
      "apps/web/src/features/account/profile/account-profile-actions.ts",
      "apps/web/src/server/account/account-profile-service.ts",
    ],
  },
  {
    name: "account-password-change",
    flow: "password-settings-item.tsx -> account-security-actions.ts -> account-security-service.ts",
    why: "Tracks the concrete account security mutation path after account security was reduced to password management.",
    files: [
      "apps/web/src/features/account/security/password-settings-item.tsx",
      "apps/web/src/features/account/security/account-security-actions.ts",
      "apps/web/src/server/account/account-security-service.ts",
    ],
  },
  {
    name: "organization-scope-switch",
    flow: "scope-switcher.tsx -> organization-general-actions.ts -> organization-route-queries.ts -> organization-cookie.ts",
    why: "Tracks the concrete organization switch mutation path across client navigation state and active-organization persistence.",
    files: [
      "apps/web/src/features/application/scope-switcher.tsx",
      "apps/web/src/features/organizations/settings/general/organization-general-actions.ts",
      "apps/web/src/server/organizations/organization-route-queries.ts",
      "apps/web/src/server/organizations/organization-cookie.ts",
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
