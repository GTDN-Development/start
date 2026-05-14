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
  createOrganization,
  createOrganizationInvite,
  deleteSignedUpUsersByEmail,
  deleteOrganizationGraph,
} from "../helpers/pocketbase-test-admin";
import { getRequiredTestEnv } from "../helpers/test-env";
import { createE2ETestRun, createIsolatedTestEmail } from "../helpers/test-run";
import { acceptOrganizationInvite, copySessionCookiesToAppOrigin } from "../helpers/organizations";

test("pending invite overrides an otherwise valid active organization after sign-in", async ({
  page,
}) => {
  test.setTimeout(120_000);

  const run = createE2ETestRun();
  const suffix = run.id.slice(-8);
  const userEmail = createIsolatedTestEmail(run.id, "organization-invite-priority-user");
  const inviteOwnerEmail = createIsolatedTestEmail(run.id, "organization-invite-priority-owner");
  const password = DEFAULT_AUTH_TEST_PASSWORD;
  const organizationASlug = `org-invite-priority-a-${suffix}`;
  const organizationAName = `Org Invite Priority A ${suffix}`;
  const organizationBSlug = `org-invite-priority-b-${suffix}`;
  const organizationBName = `Org Invite Priority B ${suffix}`;

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
    await createOrganization({
      pb,
      userId: user.id,
      name: organizationAName,
      slug: organizationASlug,
    });
    const { organization: organizationB } = await createOrganization({
      pb,
      userId: inviteOwner.id,
      name: organizationBName,
      slug: organizationBSlug,
    });
    const { token } = await createOrganizationInvite({
      pb,
      organizationId: organizationB.id,
      email: userEmail,
      role: "member",
      invitedByUserId: inviteOwner.id,
    });

    await signInUser({ page, email: userEmail, password });
    await expect(page).toHaveURL(/\/cs\/aplikace$/);

    await page.context().addCookies([
      {
        name: "active_organization",
        value: organizationASlug,
        url: getRequiredTestEnv("NEXT_PUBLIC_APP_URL"),
      },
    ]);

    await page.goto("/cs/prihlasit-se");
    await expect(page).toHaveURL(new RegExp(`/cs/o/${organizationASlug}/prehled$`));

    await signOutCurrentUser(page);
    await expectSignInPage(page);

    await page.goto(`/cs/invite/${token}`);
    await expectSignInPage(page);

    await signInUser({ page, email: userEmail, password });
    await expect(page).toHaveURL(new RegExp(`/cs/invite/${token}$`));
    await expect(page).not.toHaveURL(new RegExp(`/cs/o/${organizationASlug}/prehled$`));
    await expect(page.getByRole("heading", { name: "Připojit se do organizace" })).toBeVisible();
    await expect(page.getByText(organizationBName)).toBeVisible();

    await copySessionCookiesToAppOrigin(page);
    await acceptOrganizationInvite({ page, email: userEmail });

    await expect(page).toHaveURL(new RegExp(`/cs/o/${organizationBSlug}/prehled$`));
  } finally {
    if (pb) {
      await deleteOrganizationGraph({
        pb,
        organizationSlug: organizationASlug,
      });
      await deleteOrganizationGraph({
        pb,
        organizationSlug: organizationBSlug,
      });
      await deleteSignedUpUsersByEmail(pb, userEmail);
      await deleteSignedUpUsersByEmail(pb, inviteOwnerEmail);
    }
  }
});
