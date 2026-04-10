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
import { createE2ETestRun, createIsolatedTestEmail } from "../helpers/test-run";
import { deleteWorkspaceFromSettings } from "../helpers/workspaces";

test("owner deletes the current workspace and falls back to the personal app entry", async ({
  page,
}) => {
  test.setTimeout(120_000);

  const run = createE2ETestRun();
  const suffix = run.id.slice(-8);
  const ownerEmail = createIsolatedTestEmail(run.id, "workspace-delete-owner");
  const password = DEFAULT_AUTH_TEST_PASSWORD;
  const workspaceSlug = `ws-delete-${suffix}`;
  const workspaceName = `Workspace Delete ${suffix}`;

  let pb: PocketBase | null = null;
  let workspaceId = "";

  try {
    pb = await createPocketBaseAdminClient();
    const owner = await createVerifiedUser({
      pb,
      email: ownerEmail,
      password,
      name: `Owner ${suffix}`,
    });
    const { workspace } = await createWorkspace({
      pb,
      userId: owner.id,
      name: workspaceName,
      slug: workspaceSlug,
    });

    workspaceId = workspace.id;

    await signInUser({ page, email: ownerEmail, password });
    await expect(page).toHaveURL(/\/cs\/aplikace$/);

    await deleteWorkspaceFromSettings({
      page,
      workspaceSlug,
    });

    await expect(page).toHaveURL(/\/cs\/aplikace$/);

    await page.goto(`/cs/w/${workspaceSlug}/prehled`);
    await expect(page).toHaveURL(new RegExp(`/cs/w/${workspaceSlug}/prehled$`));
    await expect(page.locator("main:visible")).toContainText("Nenalezeno");

    await page.goto("/cs/prihlasit-se");
    await expect(page).toHaveURL(/\/cs\/aplikace$/);
    await expect(page).not.toHaveURL(new RegExp(`/cs/w/${workspaceSlug}/prehled$`));

    const workspaces = await pb.collection("workspaces").getFullList({
      filter: pb.filter("id = {:workspaceId}", {
        workspaceId,
      }),
    });

    expect(workspaces).toHaveLength(0);
  } finally {
    if (pb) {
      await deleteWorkspaceGraph({
        pb,
        workspaceSlug,
      });
      await deleteSignedUpUsersByEmail(pb, ownerEmail);
    }
  }
});
