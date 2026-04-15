import { expect, test } from "@playwright/test";
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
import { createE2ETestRun, createIsolatedTestEmail } from "../helpers/test-run";

test("wrong account opening invite sees email mismatch and recoverable state", async ({ page }) => {
  test.setTimeout(120_000);

  const run = createE2ETestRun();
  const suffix = run.id.slice(-8);
  const ownerEmail = createIsolatedTestEmail(run.id, "workspace-owner-mismatch");
  const invitedEmail = createIsolatedTestEmail(run.id, "workspace-invited-mismatch");
  const wrongEmail = createIsolatedTestEmail(run.id, "workspace-wrong-account");
  const password = DEFAULT_AUTH_TEST_PASSWORD;
  const workspaceSlug = `ws-mismatch-${suffix}`;
  const workspaceName = `Workspace Mismatch ${suffix}`;

  let pb: PocketBase | null = null;

  try {
    pb = await createPocketBaseAdminClient();
    const owner = await createVerifiedUser({ pb, email: ownerEmail, password });
    await createVerifiedUser({ pb, email: invitedEmail, password });
    await createVerifiedUser({ pb, email: wrongEmail, password });

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

    await signInUser({ page, email: wrongEmail, password });
    await expect(page).toHaveURL(/\/cs\/aplikace$/);

    await page.goto(`/cs/invite/${token}`);
    await expect(page).toHaveURL(new RegExp(`/cs/invite/${token}$`));
    await expect(page.getByRole("heading", { name: "E-mail nesouhlasí" })).toBeVisible();
    await expect(page.getByText(wrongEmail)).toBeVisible();
    await expect(
      page.getByRole("button", {
        name: "Odhlásit se a pokračovat jiným účtem",
      })
    ).toBeVisible();

    await page
      .getByRole("button", {
        name: "Odhlásit se a pokračovat jiným účtem",
      })
      .click();

    await expectSignInPage(page);
  } finally {
    if (pb) {
      await deleteWorkspaceGraph({
        pb,
        workspaceSlug,
      });
      await deleteSignedUpUsersByEmail(pb, ownerEmail);
      await deleteSignedUpUsersByEmail(pb, invitedEmail);
      await deleteSignedUpUsersByEmail(pb, wrongEmail);
    }
  }
});
