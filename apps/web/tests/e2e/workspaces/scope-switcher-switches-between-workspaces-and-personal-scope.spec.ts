import { expect, test, type Page } from "@playwright/test";
import type PocketBase from "pocketbase";
import { DEFAULT_AUTH_TEST_PASSWORD, signInUser } from "../helpers/auth";
import {
  createPocketBaseAdminClient,
  createVerifiedUser,
  createWorkspace,
  deleteSignedUpUsersByEmail,
  deleteWorkspaceGraph,
} from "../helpers/pocketbase-test-admin";
import { createE2ETestRun, createIsolatedTestEmail } from "../helpers/test-run";

test("scope switcher changes the current workspace and personal scope correctly", async ({
  page,
}) => {
  test.setTimeout(120_000);

  const run = createE2ETestRun();
  const suffix = run.id.slice(-8);
  const userEmail = createIsolatedTestEmail(run.id, "scope-switcher-user");
  const userName = `Switcher ${suffix}`;
  const workspaceASlug = `ws-scope-a-${suffix}`;
  const workspaceAName = `Scope Workspace A ${suffix}`;
  const workspaceBSlug = `ws-scope-b-${suffix}`;
  const workspaceBName = `Scope Workspace B ${suffix}`;
  const password = DEFAULT_AUTH_TEST_PASSWORD;

  let pb: PocketBase | null = null;

  try {
    pb = await createPocketBaseAdminClient();
    const user = await createVerifiedUser({
      pb,
      email: userEmail,
      password,
      name: userName,
    });

    await createWorkspace({
      pb,
      userId: user.id,
      name: workspaceAName,
      slug: workspaceASlug,
    });
    await createWorkspace({
      pb,
      userId: user.id,
      name: workspaceBName,
      slug: workspaceBSlug,
    });

    await signInUser({ page, email: userEmail, password });
    await expect(page).toHaveURL(/\/cs\/aplikace$/);

    await switchScope(page, userName, workspaceAName);
    await expect(page).toHaveURL(new RegExp(`/cs/w/${workspaceASlug}/prehled$`));

    await page.goto("/cs/prihlasit-se");
    await expect(page).toHaveURL(new RegExp(`/cs/w/${workspaceASlug}/prehled$`));

    await switchScope(page, workspaceAName, workspaceBName);
    await expect(page).toHaveURL(new RegExp(`/cs/w/${workspaceBSlug}/prehled$`));

    await page.goto("/cs/prihlasit-se");
    await expect(page).toHaveURL(new RegExp(`/cs/w/${workspaceBSlug}/prehled$`));

    await switchScope(page, workspaceBName, userName);
    await expect(page).toHaveURL(/\/cs\/aplikace$/);
  } finally {
    if (pb) {
      await deleteWorkspaceGraph({
        pb,
        workspaceSlug: workspaceASlug,
      });
      await deleteWorkspaceGraph({
        pb,
        workspaceSlug: workspaceBSlug,
      });
      await deleteSignedUpUsersByEmail(pb, userEmail);
    }
  }
});

async function switchScope(page: Page, triggerLabel: string, nextLabel: string): Promise<void> {
  const trigger = page.getByRole("button", { name: triggerLabel }).first();

  await expect(trigger).toBeVisible();
  await trigger.click();
  await expect(page.getByText("Pracovní prostory")).toBeVisible();
  await page.getByRole("menuitem", { name: nextLabel }).click();
}
