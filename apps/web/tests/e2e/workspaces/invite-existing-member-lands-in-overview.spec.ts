import { expect, test } from "@playwright/test";
import type PocketBase from "pocketbase";
import { DEFAULT_AUTH_TEST_PASSWORD, signInUser } from "../helpers/auth";
import {
  createPocketBaseAdminClient,
  createVerifiedUser,
  createWorkspace,
  createWorkspaceInvite,
  createWorkspaceMembership,
  deleteSignedUpUsersByEmail,
  deleteWorkspaceGraph,
} from "../helpers/pocketbase-test-admin";
import { createE2ETestRun, createIsolatedTestEmail } from "../helpers/test-run";

test("existing workspace member opening an invite lands directly in workspace overview", async ({
  page,
}) => {
  test.setTimeout(120_000);

  const run = createE2ETestRun();
  const suffix = run.id.slice(-8);
  const ownerEmail = createIsolatedTestEmail(run.id, "workspace-owner-existing-member");
  const memberEmail = createIsolatedTestEmail(run.id, "workspace-member-existing-member");
  const password = DEFAULT_AUTH_TEST_PASSWORD;
  const workspaceSlug = `ws-existing-member-${suffix}`;
  const workspaceName = `Workspace Existing Member ${suffix}`;

  let pb: PocketBase | null = null;

  try {
    pb = await createPocketBaseAdminClient();
    const owner = await createVerifiedUser({
      pb,
      email: ownerEmail,
      password,
      name: `Owner ${suffix}`,
    });
    const member = await createVerifiedUser({
      pb,
      email: memberEmail,
      password,
      name: `Member ${suffix}`,
    });
    const { workspace } = await createWorkspace({
      pb,
      userId: owner.id,
      name: workspaceName,
      slug: workspaceSlug,
    });

    await createWorkspaceMembership({
      pb,
      workspaceId: workspace.id,
      userId: member.id,
      role: "member",
    });

    const { token } = await createWorkspaceInvite({
      pb,
      workspaceId: workspace.id,
      email: memberEmail,
      role: "member",
      invitedByUserId: owner.id,
    });

    await signInUser({ page, email: memberEmail, password });
    await expect(page).toHaveURL(/\/cs\/aplikace$/);

    await page.goto(`/cs/invite/${token}`);
    await expect(page).toHaveURL(new RegExp(`/cs/w/${workspaceSlug}/prehled$`));
  } finally {
    if (pb) {
      await deleteWorkspaceGraph({
        pb,
        workspaceSlug,
      });
      await deleteSignedUpUsersByEmail(pb, ownerEmail);
      await deleteSignedUpUsersByEmail(pb, memberEmail);
    }
  }
});
