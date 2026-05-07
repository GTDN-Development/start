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
  createOrganization,
  createOrganizationInvite,
  deleteSignedUpUsersByEmail,
  deleteOrganizationGraph,
} from "../helpers/pocketbase-test-admin";
import { acceptOrganizationInvite, copySessionCookiesToAppOrigin } from "../helpers/organizations";
import { createE2ETestRun, createIsolatedTestEmail } from "../helpers/test-run";

test("unverified invited user verifies email and returns to invite handling before acceptance", async ({
  page,
}) => {
  test.setTimeout(120_000);

  const run = createE2ETestRun();
  const suffix = run.id.slice(-8);
  const ownerEmail = createIsolatedTestEmail(run.id, "organization-owner-unverified-invite");
  const invitedEmail = createIsolatedTestEmail(run.id, "organization-invited-unverified");
  const password = DEFAULT_AUTH_TEST_PASSWORD;
  const organizationSlug = `org-unverified-invite-${suffix}`;
  const organizationName = `Organization Unverified Invite ${suffix}`;

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
    await expect(page.getByRole("heading", { name: "Připojit se do organizace" })).toBeVisible();
    await expect(page.getByText(organizationName)).toBeVisible();

    await copySessionCookiesToAppOrigin(page);
    await acceptOrganizationInvite({ page, email: invitedEmail });

    await expect(page).toHaveURL(new RegExp(`/cs/o/${organizationSlug}/prehled$`));
  } finally {
    if (pb) {
      await deleteOrganizationGraph({
        pb,
        organizationSlug,
      });
      await deleteSignedUpUsersByEmail(pb, ownerEmail);
      await deleteSignedUpUsersByEmail(pb, invitedEmail);
    }
  }
});
