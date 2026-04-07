import { expect, test } from "@playwright/test";
import type PocketBase from "pocketbase";
import { DEFAULT_AUTH_TEST_PASSWORD, signInUser } from "../helpers/auth";
import {
  createPocketBaseAdminClient,
  createWorkspace,
  createVerifiedUser,
  deleteSignedUpUsersByEmail,
  deleteWorkspaceGraph,
} from "../helpers/pocketbase-test-admin";
import { createE2ETestRun, createIsolatedTestEmail } from "../helpers/test-run";

test("inaccessible workspace URL renders workspace-scoped 404 state", async ({ page }) => {
  test.setTimeout(120_000);

  const run = createE2ETestRun();
  const suffix = run.id.slice(-8);
  const ownerEmail = createIsolatedTestEmail(run.id, "workspace-owner-404");
  const unrelatedEmail = createIsolatedTestEmail(run.id, "workspace-unrelated-404");
  const password = DEFAULT_AUTH_TEST_PASSWORD;
  const workspaceSlug = `ws-404-${suffix}`;
  const workspaceName = `Workspace 404 ${suffix}`;

  let pb: PocketBase | null = null;

  try {
    pb = await createPocketBaseAdminClient();
    const owner = await createVerifiedUser({ pb, email: ownerEmail, password });
    await createVerifiedUser({ pb, email: unrelatedEmail, password });

    await createWorkspace({
      pb,
      userId: owner.id,
      name: workspaceName,
      slug: workspaceSlug,
    });

    await signInUser({ page, email: unrelatedEmail, password });
    await expect(page).toHaveURL(/\/cs\/aplikace$/);

    await page.goto(`/cs/w/${workspaceSlug}/prehled`);

    await expect(page).toHaveURL(new RegExp(`/cs/w/${workspaceSlug}/prehled$`));
    await expect(page).not.toHaveURL(/\/cs\/aplikace$/);
    const visibleMain = page.locator("main:visible");

    await expect(visibleMain).toContainText("Nenalezeno");
    await expect(visibleMain).toContainText("Stránku, kterou hledáte, se nepodařilo najít.");
  } finally {
    if (pb) {
      await deleteWorkspaceGraph({
        pb,
        workspaceSlug,
      });
      await deleteSignedUpUsersByEmail(pb, ownerEmail);
      await deleteSignedUpUsersByEmail(pb, unrelatedEmail);
    }
  }
});
