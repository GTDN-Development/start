import { expect, test } from "@playwright/test";
import type PocketBase from "pocketbase";
import { DEFAULT_AUTH_TEST_PASSWORD, signInUser } from "../helpers/auth";
import {
  createPocketBaseAdminClient,
  createVerifiedUser,
  createWorkspace,
  deleteSignedUpUsersByEmail,
  deleteWorkspaceGraph,
} from "../helpers/pocketbase-test-admin";
import { updateWorkspaceSlug } from "../helpers/workspaces";
import { createE2ETestRun, createIsolatedTestEmail } from "../helpers/test-run";

test("changing a workspace slug redirects to the same workspace under the new slug", async ({
  page,
}) => {
  test.setTimeout(120_000);

  const run = createE2ETestRun();
  const suffix = run.id.slice(-8);
  const ownerEmail = createIsolatedTestEmail(run.id, "workspace-slug-owner");
  const password = DEFAULT_AUTH_TEST_PASSWORD;
  const initialWorkspaceSlug = `ws-slug-old-${suffix}`;
  const nextWorkspaceSlug = `ws-slug-new-${suffix}`;
  const workspaceName = `Workspace Slug ${suffix}`;

  let pb: PocketBase | null = null;

  try {
    pb = await createPocketBaseAdminClient();
    const owner = await createVerifiedUser({
      pb,
      email: ownerEmail,
      password,
      name: `Owner ${suffix}`,
    });

    await createWorkspace({
      pb,
      userId: owner.id,
      name: workspaceName,
      slug: initialWorkspaceSlug,
    });

    await signInUser({ page, email: ownerEmail, password });
    await expect(page).toHaveURL(/\/cs\/aplikace$/);

    await updateWorkspaceSlug({
      page,
      currentSlug: initialWorkspaceSlug,
      nextSlug: nextWorkspaceSlug,
    });

    await page.goto(`/cs/w/${initialWorkspaceSlug}/prehled`);
    await expect(page).toHaveURL(new RegExp(`/cs/w/${initialWorkspaceSlug}/prehled$`));
    await expect(page.locator("main:visible")).toContainText("Nenalezeno");

    await page.goto("/cs/prihlasit-se");
    await expect(page).toHaveURL(new RegExp(`/cs/w/${nextWorkspaceSlug}/prehled$`));
  } finally {
    if (pb) {
      await deleteWorkspaceGraph({
        pb,
        workspaceSlug: nextWorkspaceSlug,
      });
      await deleteWorkspaceGraph({
        pb,
        workspaceSlug: initialWorkspaceSlug,
      });
      await deleteSignedUpUsersByEmail(pb, ownerEmail);
    }
  }
});
