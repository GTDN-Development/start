import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const WEB_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const APP_DIRECTORY = path.join(WEB_ROOT, "src/app");
const FORBIDDEN_RENDER_MUTATORS = [
  "applyServerActionAuthCookies",
  "appendAuthCookiesToResponse",
  "redirectHrefWithAuthCookies",
  "redirectPathnameWithAuthCookies",
  "setActiveOrganizationSlugCookie",
  "clearActiveOrganizationSlugCookie",
  "clearPendingInviteTokenCookie",
] as const;

describe("render cookie boundary", function describeRenderCookieBoundary() {
  it("keeps page and layout files free of cookie mutation helpers", function testRenderBoundary() {
    const renderFiles = collectRenderFiles(APP_DIRECTORY);

    for (const filePath of renderFiles) {
      const content = readFileSync(filePath, "utf8");

      for (const forbiddenIdentifier of FORBIDDEN_RENDER_MUTATORS) {
        expect(content, `${filePath} should not reference ${forbiddenIdentifier}`).not.toContain(
          forbiddenIdentifier
        );
      }
    }
  });
});

function collectRenderFiles(directoryPath: string): string[] {
  const entries = readdirSync(directoryPath).sort();
  const files: string[] = [];

  for (const entry of entries) {
    const entryPath = path.join(directoryPath, entry);
    const entryStat = statSync(entryPath);

    if (entryStat.isDirectory()) {
      files.push(...collectRenderFiles(entryPath));
      continue;
    }

    if (entry === "page.tsx" || entry === "layout.tsx") {
      files.push(entryPath);
    }
  }

  return files;
}
