import { expect, test } from "@playwright/test";
import type PocketBase from "pocketbase";
import {
  DEFAULT_AUTH_TEST_PASSWORD,
  deleteAccountFromSettings,
  expectSignInPage,
  signInUser,
} from "../helpers/auth";
import {
  createPocketBaseAdminClient,
  createVerifiedUser,
  createWorkspace,
  createWorkspaceMembership,
  deleteSignedUpUsersByEmail,
  deleteWorkspaceGraph,
} from "../helpers/pocketbase-test-admin";
import { createE2ETestRun, createIsolatedTestEmail } from "../helpers/test-run";

test("account deletion removes memberships, clears the session, and returns to sign-in", async ({
  page,
}) => {
  test.setTimeout(120_000);

  const run = createE2ETestRun();
  const suffix = run.id.slice(-8);
  const userEmail = createIsolatedTestEmail(run.id, "account-delete-user");
  const otherOwnerEmail = createIsolatedTestEmail(run.id, "account-delete-other-owner");
  const password = DEFAULT_AUTH_TEST_PASSWORD;
  const ownedWorkspaceSlug = `ws-account-delete-owned-${suffix}`;
  const sharedWorkspaceSlug = `ws-account-delete-shared-${suffix}`;

  let pb: PocketBase | null = null;
  let userId = "";

  try {
    pb = await createPocketBaseAdminClient();
    const user = await createVerifiedUser({
      pb,
      email: userEmail,
      password,
      name: `Delete Me ${suffix}`,
    });
    const otherOwner = await createVerifiedUser({
      pb,
      email: otherOwnerEmail,
      password,
      name: `Other Owner ${suffix}`,
    });
    const { workspace: ownedWorkspace } = await createWorkspace({
      pb,
      userId: otherOwner.id,
      name: `Owned Workspace ${suffix}`,
      slug: ownedWorkspaceSlug,
    });
    const { workspace: sharedWorkspace } = await createWorkspace({
      pb,
      userId: otherOwner.id,
      name: `Shared Workspace ${suffix}`,
      slug: sharedWorkspaceSlug,
    });

    userId = user.id;

    await createWorkspaceMembership({
      pb,
      workspaceId: ownedWorkspace.id,
      userId: user.id,
      role: "owner",
    });
    await createWorkspaceMembership({
      pb,
      workspaceId: sharedWorkspace.id,
      userId: user.id,
      role: "member",
    });

    await signInUser({ page, email: userEmail, password });
    await expect(page).toHaveURL(/\/cs\/aplikace$/);

    await deleteAccountFromSettings({
      page,
      password,
    });

    await expectSignInPage(page);

    await page.goto("/cs/aplikace");
    await expectSignInPage(page);

    const users = await pb.collection("users").getFullList({
      filter: pb.filter("id = {:userId}", {
        userId,
      }),
    });
    const memberships = await pb.collection("workspace_members").getFullList({
      filter: pb.filter("user = {:userId}", {
        userId,
      }),
    });
    const deviceSessions = await pb.collection("user_device_sessions").getFullList({
      filter: pb.filter("user = {:userId}", {
        userId,
      }),
    });

    expect(users).toHaveLength(0);
    expect(memberships).toHaveLength(0);
    expect(deviceSessions).toHaveLength(0);
  } finally {
    if (pb) {
      await deleteWorkspaceGraph({
        pb,
        workspaceSlug: ownedWorkspaceSlug,
      });
      await deleteWorkspaceGraph({
        pb,
        workspaceSlug: sharedWorkspaceSlug,
      });
      await deleteSignedUpUsersByEmail(pb, userEmail);
      await deleteSignedUpUsersByEmail(pb, otherOwnerEmail);
    }
  }
});
