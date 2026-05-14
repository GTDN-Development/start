import { expect, test } from "@playwright/test";
import type PocketBase from "pocketbase";
import { DEFAULT_AUTH_TEST_PASSWORD, expectSignInPage, signInUser } from "../helpers/auth";
import {
  createPocketBaseAdminClient,
  createOrganization,
  createVerifiedUser,
  createOrganizationInvite,
  deleteSignedUpUsersByEmail,
  deleteOrganizationGraph,
} from "../helpers/pocketbase-test-admin";
import { createE2ETestRun, createIsolatedTestEmail } from "../helpers/test-run";

test("wrong account opening invite sees email mismatch and recoverable state", async ({ page }) => {
  test.setTimeout(120_000);

  const run = createE2ETestRun();
  const suffix = run.id.slice(-8);
  const ownerEmail = createIsolatedTestEmail(run.id, "organization-owner-mismatch");
  const invitedEmail = createIsolatedTestEmail(run.id, "organization-invited-mismatch");
  const wrongEmail = createIsolatedTestEmail(run.id, "organization-wrong-account");
  const password = DEFAULT_AUTH_TEST_PASSWORD;
  const organizationSlug = `org-mismatch-${suffix}`;
  const organizationName = `Org Mismatch ${suffix}`;

  let pb: PocketBase | null = null;

  try {
    pb = await createPocketBaseAdminClient();
    const owner = await createVerifiedUser({ pb, email: ownerEmail, password });
    await createVerifiedUser({ pb, email: invitedEmail, password });
    await createVerifiedUser({ pb, email: wrongEmail, password });

    const { organization } = await createOrganization({
      pb,
      userId: owner.id,
      name: organizationName,
      slug: organizationSlug,
    });
    const { token } = await createOrganizationInvite({
      pb,
      organizationId: organization.id,
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
      await deleteOrganizationGraph({
        pb,
        organizationSlug,
      });
      await deleteSignedUpUsersByEmail(pb, ownerEmail);
      await deleteSignedUpUsersByEmail(pb, invitedEmail);
      await deleteSignedUpUsersByEmail(pb, wrongEmail);
    }
  }
});
