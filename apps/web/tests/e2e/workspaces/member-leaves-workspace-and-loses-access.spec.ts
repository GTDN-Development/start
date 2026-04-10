import { expect, test } from "@playwright/test";
import type PocketBase from "pocketbase";
import { DEFAULT_AUTH_TEST_PASSWORD, signInUser } from "../helpers/auth";
import {
  createPocketBaseAdminClient,
  createVerifiedUser,
  createWorkspace,
  createWorkspaceMembership,
  deleteSignedUpUsersByEmail,
  deleteWorkspaceGraph,
} from "../helpers/pocketbase-test-admin";
import { createE2ETestRun, createIsolatedTestEmail } from "../helpers/test-run";
import { leaveWorkspaceFromSettings } from "../helpers/workspaces";

test("member leaves a workspace and immediately loses access to it", async ({ page }) => {
  test.setTimeout(120_000);

  const run = createE2ETestRun();
  const suffix = run.id.slice(-8);
  const ownerEmail = createIsolatedTestEmail(run.id, "workspace-member-leave-owner");
  const memberEmail = createIsolatedTestEmail(run.id, "workspace-member-leave-member");
  const password = DEFAULT_AUTH_TEST_PASSWORD;
  const workspaceSlug = `ws-member-leave-${suffix}`;
  const workspaceName = `Workspace Member Leave ${suffix}`;

  let pb: PocketBase | null = null;
  let workspaceId = "";
  let memberId = "";

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

    workspaceId = workspace.id;
    memberId = member.id;

    await createWorkspaceMembership({
      pb,
      workspaceId: workspace.id,
      userId: member.id,
      role: "member",
    });

    await signInUser({ page, email: memberEmail, password });
    await expect(page).toHaveURL(/\/cs\/aplikace$/);

    await leaveWorkspaceFromSettings({
      page,
      workspaceSlug,
    });

    await expect(page).toHaveURL(/\/cs\/aplikace$/);
    await expect(page.getByText("K tomuto workspace už nemáte přístup.")).toBeVisible();

    await page.goto(`/cs/w/${workspaceSlug}/prehled`);
    await expect(page).toHaveURL(new RegExp(`/cs/w/${workspaceSlug}/prehled$`));
    await expect(page.locator("main:visible")).toContainText("Nenalezeno");

    const memberships = await pb.collection("workspace_members").getFullList({
      filter: pb.filter("workspace = {:workspaceId} && user = {:userId}", {
        workspaceId,
        userId: memberId,
      }),
    });

    expect(memberships).toHaveLength(0);
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
