import { expect, test, type Page } from "@playwright/test";
import type PocketBase from "pocketbase";
import { DEFAULT_AUTH_TEST_PASSWORD, expectSignInPage, signInUser } from "../helpers/auth";
import {
  createPocketBaseAdminClient,
  createWorkspace,
  createVerifiedUser,
  createWorkspaceInvite,
  deleteSignedUpUsersByEmail,
  deleteWorkspaceGraph,
} from "../helpers/pocketbase-test-admin";
import { getRequiredTestEnv } from "../helpers/test-env";
import { createE2ETestRun, createIsolatedTestEmail } from "../helpers/test-run";
import { acceptWorkspaceInvite } from "../helpers/workspaces";

test("invited user accepts invite and lands in the correct workspace", async ({ page }) => {
  test.setTimeout(120_000);

  const run = createE2ETestRun();
  const suffix = run.id.slice(-8);
  const ownerEmail = createIsolatedTestEmail(run.id, "workspace-owner");
  const invitedEmail = createIsolatedTestEmail(run.id, "workspace-invited");
  const password = DEFAULT_AUTH_TEST_PASSWORD;
  const workspaceSlug = `ws-invite-${suffix}`;
  const workspaceName = `Workspace Invite ${suffix}`;

  let pb: PocketBase | null = null;

  try {
    pb = await createPocketBaseAdminClient();
    const owner = await createVerifiedUser({ pb, email: ownerEmail, password });
    await createVerifiedUser({ pb, email: invitedEmail, password });

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
    await expect(page).toHaveURL(new RegExp(`/cs/invite/${token}$`));
    await expect(page.getByRole("heading", { name: "Připojit se do workspace" })).toBeVisible();
    await expect(page.getByText(workspaceName)).toBeVisible();

    await copySessionCookiesToLocalhost(page);
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

async function copySessionCookiesToLocalhost(page: Page): Promise<void> {
  const sessionCookieNames = new Set(["pb_auth", "pb_auth_persist", "app_device_session"]);
  const sessionCookies = (await page.context().cookies()).filter((cookie) =>
    sessionCookieNames.has(cookie.name)
  );

  await page.context().addCookies(
    sessionCookies.map((cookie) => ({
      name: cookie.name,
      value: cookie.value,
      url: getRequiredTestEnv("NEXT_PUBLIC_APP_URL"),
      expires: cookie.expires,
      httpOnly: cookie.httpOnly,
      secure: cookie.secure,
      sameSite: cookie.sameSite,
    }))
  );
}
