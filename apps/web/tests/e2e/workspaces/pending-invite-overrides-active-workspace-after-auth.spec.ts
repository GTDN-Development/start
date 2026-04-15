import { expect, test } from "@playwright/test";
import type PocketBase from "pocketbase";
import {
  DEFAULT_AUTH_TEST_PASSWORD,
  expectSignInPage,
  signInUser,
  signOutCurrentUser,
} from "../helpers/auth";
import {
  createPocketBaseAdminClient,
  createVerifiedUser,
  createWorkspace,
  createWorkspaceInvite,
  deleteSignedUpUsersByEmail,
  deleteWorkspaceGraph,
} from "../helpers/pocketbase-test-admin";
import { getRequiredTestEnv } from "../helpers/test-env";
import { createE2ETestRun, createIsolatedTestEmail } from "../helpers/test-run";
import { acceptWorkspaceInvite, copySessionCookiesToAppOrigin } from "../helpers/workspaces";

test("pending invite overrides an otherwise valid active workspace after sign-in", async ({
  page,
}) => {
  test.setTimeout(120_000);

  const run = createE2ETestRun();
  const suffix = run.id.slice(-8);
  const userEmail = createIsolatedTestEmail(run.id, "workspace-invite-priority-user");
  const inviteOwnerEmail = createIsolatedTestEmail(run.id, "workspace-invite-priority-owner");
  const password = DEFAULT_AUTH_TEST_PASSWORD;
  const workspaceASlug = `ws-invite-priority-a-${suffix}`;
  const workspaceAName = `Workspace Invite Priority A ${suffix}`;
  const workspaceBSlug = `ws-invite-priority-b-${suffix}`;
  const workspaceBName = `Workspace Invite Priority B ${suffix}`;

  let pb: PocketBase | null = null;

  try {
    pb = await createPocketBaseAdminClient();
    const user = await createVerifiedUser({
      pb,
      email: userEmail,
      password,
      name: `User ${suffix}`,
    });
    const inviteOwner = await createVerifiedUser({
      pb,
      email: inviteOwnerEmail,
      password,
      name: `Invite Owner ${suffix}`,
    });
    await createWorkspace({
      pb,
      userId: user.id,
      name: workspaceAName,
      slug: workspaceASlug,
    });
    const { workspace: workspaceB } = await createWorkspace({
      pb,
      userId: inviteOwner.id,
      name: workspaceBName,
      slug: workspaceBSlug,
    });
    const { token } = await createWorkspaceInvite({
      pb,
      workspaceId: workspaceB.id,
      email: userEmail,
      role: "member",
      invitedByUserId: inviteOwner.id,
    });

    await signInUser({ page, email: userEmail, password });
    await expect(page).toHaveURL(/\/cs\/aplikace$/);

    await page.context().addCookies([
      {
        name: "active_workspace",
        value: workspaceASlug,
        url: getRequiredTestEnv("NEXT_PUBLIC_APP_URL"),
      },
    ]);

    await page.goto("/cs/prihlasit-se");
    await expect(page).toHaveURL(new RegExp(`/cs/w/${workspaceASlug}/prehled$`));

    await signOutCurrentUser(page);
    await expectSignInPage(page);

    await page.goto(`/cs/invite/${token}`);
    await expectSignInPage(page);

    await signInUser({ page, email: userEmail, password });
    await expect(page).toHaveURL(new RegExp(`/cs/invite/${token}$`));
    await expect(page).not.toHaveURL(new RegExp(`/cs/w/${workspaceASlug}/prehled$`));
    await expect(page.getByRole("heading", { name: "Připojit se do workspace" })).toBeVisible();
    await expect(page.getByText(workspaceBName)).toBeVisible();

    await copySessionCookiesToAppOrigin(page);
    await acceptWorkspaceInvite({ page, email: userEmail });

    await expect(page).toHaveURL(new RegExp(`/cs/w/${workspaceBSlug}/prehled$`));
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
      await deleteSignedUpUsersByEmail(pb, inviteOwnerEmail);
    }
  }
});
