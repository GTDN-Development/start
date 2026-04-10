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

test("final remaining owner cannot leave the workspace", async ({ page }) => {
  test.setTimeout(120_000);

  const run = createE2ETestRun();
  const suffix = run.id.slice(-8);
  const ownerEmail = createIsolatedTestEmail(run.id, "workspace-last-owner");
  const password = DEFAULT_AUTH_TEST_PASSWORD;
  const workspaceSlug = `ws-last-owner-${suffix}`;
  const workspaceName = `Workspace Last Owner ${suffix}`;

  let pb: PocketBase | null = null;
  let ownerId = "";
  let workspaceId = "";

  try {
    pb = await createPocketBaseAdminClient();
    const owner = await createVerifiedUser({
      pb,
      email: ownerEmail,
      password,
      name: `Owner ${suffix}`,
    });

    ownerId = owner.id;

    const { workspace } = await createWorkspace({
      pb,
      userId: owner.id,
      name: workspaceName,
      slug: workspaceSlug,
    });

    workspaceId = workspace.id;

    await signInUser({ page, email: ownerEmail, password });
    await expect(page).toHaveURL(/\/cs\/aplikace$/);

    await page.goto(`/cs/w/${workspaceSlug}/nastaveni`);
    await expect(page).toHaveURL(new RegExp(`/cs/w/${workspaceSlug}/nastaveni$`));
    await expect(
      page.getByText("Pro opuštění workspace musí mít workspace alespoň dva vlastníky.")
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Opustit workspace" })).toBeDisabled();

    const ownerMemberships = await pb.collection("workspace_members").getFullList({
      filter: pb.filter("workspace = {:workspaceId} && user = {:userId}", {
        workspaceId,
        userId: ownerId,
      }),
    });

    expect(ownerMemberships).toHaveLength(1);
    expect(ownerMemberships[0]?.role).toBe("owner");
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
