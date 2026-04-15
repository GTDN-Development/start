import { expect, test } from "@playwright/test";
import type PocketBase from "pocketbase";
import {
  DEFAULT_AUTH_TEST_PASSWORD,
  expectPendingVerifyEmailPage,
  expectSignInPage,
  signInUser,
} from "../helpers/auth";
import { waitForPocketBaseEmailLinkPath } from "../helpers/mailpit";
import {
  createPocketBaseAdminClient,
  createUser,
  createVerifiedUser,
  createWorkspace,
  createWorkspaceInvite,
  deleteSignedUpUsersByEmail,
  deleteWorkspaceGraph,
} from "../helpers/pocketbase-test-admin";
import { acceptWorkspaceInvite, copySessionCookiesToAppOrigin } from "../helpers/workspaces";
import { createE2ETestRun, createIsolatedTestEmail } from "../helpers/test-run";

test("unverified invited user verifies email and returns to invite handling before acceptance", async ({
  page,
}) => {
  test.setTimeout(120_000);

  const run = createE2ETestRun();
  const suffix = run.id.slice(-8);
  const ownerEmail = createIsolatedTestEmail(run.id, "workspace-owner-unverified-invite");
  const invitedEmail = createIsolatedTestEmail(run.id, "workspace-invited-unverified");
  const password = DEFAULT_AUTH_TEST_PASSWORD;
  const workspaceSlug = `ws-unverified-invite-${suffix}`;
  const workspaceName = `Workspace Unverified Invite ${suffix}`;

  let pb: PocketBase | null = null;

  try {
    pb = await createPocketBaseAdminClient();
    const owner = await createVerifiedUser({
      pb,
      email: ownerEmail,
      password,
      name: `Owner ${suffix}`,
    });

    await createUser({
      pb,
      email: invitedEmail,
      password,
      name: `Invited ${suffix}`,
      verified: false,
    });

    const { workspace } = await createWorkspace({
      pb,
      userId: owner.id,
      name: workspaceName,
      slug: workspaceSlug,
    });
    const { token } = await createWorkspaceInvite({
      pb,
      workspaceId: workspace.id,
      email: invitedEmail,
      role: "member",
      invitedByUserId: owner.id,
    });

    await page.goto(`/cs/invite/${token}`);
    await expectSignInPage(page);

    await signInUser({ page, email: invitedEmail, password });
    await expectPendingVerifyEmailPage(page, invitedEmail);

    await page.getByRole("button", { name: "Poslat ověřovací e-mail znovu" }).click();
    await expect(
      page.getByText(
        "Pokud tato e-mailová adresa existuje a stále čeká na ověření, poslali jsme nový ověřovací e-mail."
      )
    ).toBeVisible();

    const verificationPath = await waitForPocketBaseEmailLinkPath({
      toEmail: invitedEmail,
      receivedAfter: run.startedAt,
      action: "verify-email",
      timeoutMs: 45_000,
    });

    await page.goto(verificationPath);
    await expect(page).toHaveURL(new RegExp(`/cs/invite/${token}$`));
    await expect(page.getByRole("heading", { name: "Připojit se do workspace" })).toBeVisible();
    await expect(page.getByText(workspaceName)).toBeVisible();

    await copySessionCookiesToAppOrigin(page);
    await acceptWorkspaceInvite({ page, email: invitedEmail });

    await expect(page).toHaveURL(new RegExp(`/cs/w/${workspaceSlug}/prehled$`));
  } finally {
    if (pb) {
      await deleteWorkspaceGraph({
        pb,
        workspaceSlug,
      });
      await deleteSignedUpUsersByEmail(pb, ownerEmail);
      await deleteSignedUpUsersByEmail(pb, invitedEmail);
    }
  }
});
