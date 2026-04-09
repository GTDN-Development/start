import { expect, test } from "@playwright/test";
import type PocketBase from "pocketbase";
import type { WorkspaceMembersRecord } from "../../../src/types/pocketbase";
import { DEFAULT_AUTH_TEST_PASSWORD, signInUser } from "../helpers/auth";
import {
  createPocketBaseAdminClient,
  createWorkspace,
  createVerifiedUser,
  deleteSignedUpUsersByEmail,
  deleteWorkspaceGraph,
} from "../helpers/pocketbase-test-admin";
import { getRequiredTestEnv } from "../helpers/test-env";
import { createE2ETestRun, createIsolatedTestEmail } from "../helpers/test-run";

test("stale active workspace falls back to personal app entry after external access loss", async ({
  page,
}) => {
  test.setTimeout(120_000);

  const run = createE2ETestRun();
  const suffix = run.id.slice(-8);
  const ownerEmail = createIsolatedTestEmail(run.id, "workspace-owner-stale");
  const memberEmail = createIsolatedTestEmail(run.id, "workspace-member-stale");
  const password = DEFAULT_AUTH_TEST_PASSWORD;
  const workspaceSlug = `ws-stale-${suffix}`;
  const workspaceName = `Workspace Stale ${suffix}`;

  let pb: PocketBase | null = null;
  let memberMembership: WorkspaceMembersRecord | null = null;

  try {
    pb = await createPocketBaseAdminClient();
    const owner = await createVerifiedUser({ pb, email: ownerEmail, password });
    const member = await createVerifiedUser({ pb, email: memberEmail, password });

    const { workspace } = await createWorkspace({
      pb,
      userId: owner.id,
      name: workspaceName,
      slug: workspaceSlug,
    });

    memberMembership = await pb.collection("workspace_members").create<WorkspaceMembersRecord>({
      workspace: workspace.id,
      user: member.id,
      role: "member",
    });

    await signInUser({ page, email: memberEmail, password });
    await expect(page).toHaveURL(/\/cs\/aplikace$/);

    await page.context().addCookies([
      {
        name: "active_workspace",
        value: workspaceSlug,
        url: getRequiredTestEnv("NEXT_PUBLIC_APP_URL"),
      },
    ]);

    await page.goto("/cs/prihlasit-se");
    await expect(page).toHaveURL(new RegExp(`/cs/w/${workspaceSlug}/prehled$`));

    await pb.collection("workspace_members").delete(memberMembership.id);
    memberMembership = null;

    await page.goto("/cs/prihlasit-se");
    await expect(page).toHaveURL(/\/cs\/aplikace$/);
    await expect(page).not.toHaveURL(new RegExp(`/cs/w/${workspaceSlug}/prehled$`));
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
