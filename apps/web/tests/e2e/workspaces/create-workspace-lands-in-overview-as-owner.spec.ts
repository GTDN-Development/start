import { expect, test } from "@playwright/test";
import type PocketBase from "pocketbase";
import { DEFAULT_AUTH_TEST_PASSWORD, signInUser } from "../helpers/auth";
import {
  createPocketBaseAdminClient,
  createVerifiedUser,
  deleteSignedUpUsersByEmail,
  deleteWorkspaceGraph,
} from "../helpers/pocketbase-test-admin";
import { createE2ETestRun, createIsolatedTestEmail } from "../helpers/test-run";

test("user creates a workspace and lands in it as owner", async ({ page }) => {
  test.setTimeout(120_000);

  const run = createE2ETestRun();
  const suffix = run.id.slice(-8);
  const email = createIsolatedTestEmail(run.id, "workspace-create-owner");
  const password = DEFAULT_AUTH_TEST_PASSWORD;
  const ownerName = `Workspace Creator ${suffix}`;
  const workspaceName = `ws-${suffix}`;

  let pb: PocketBase | null = null;
  let createdWorkspaceSlug: string | null = null;

  try {
    pb = await createPocketBaseAdminClient();
    await createVerifiedUser({
      pb,
      email,
      password,
      name: ownerName,
    });

    await signInUser({ page, email, password });
    await expect(page).toHaveURL(/\/cs\/aplikace$/);

    await page.getByRole("button", { name: ownerName }).click();
    await page
      .getByRole("menuitem", {
        name: "Vytvořit pracovní prostor",
      })
      .click();

    await page.locator("#workspace-create-name").fill(workspaceName);
    await page.getByRole("button", { name: "Vytvořit workspace" }).click();

    await expect(page).toHaveURL(new RegExp(`/cs/w/${workspaceName}/prehled$`));

    const workspaceMatch = page.url().match(/\/cs\/w\/([^/]+)\/prehled$/);
    createdWorkspaceSlug = workspaceMatch?.[1] ?? null;

    if (!createdWorkspaceSlug) {
      throw new Error(`Unable to resolve created workspace slug from URL: ${page.url()}`);
    }

    await page.goto(`/cs/w/${createdWorkspaceSlug}/nastaveni/clenove`);
    await expect(page).toHaveURL(new RegExp(`/cs/w/${createdWorkspaceSlug}/nastaveni/clenove$`));
    await expect(
      page
        .locator("tbody tr")
        .filter({
          hasText: email,
        })
        .filter({
          hasText: "Vlastník",
        })
        .first()
    ).toBeVisible();
  } finally {
    if (pb && createdWorkspaceSlug) {
      await deleteWorkspaceGraph({
        pb,
        workspaceSlug: createdWorkspaceSlug,
      });
    }

    if (pb) {
      await deleteSignedUpUsersByEmail(pb, email);
    }
  }
});
