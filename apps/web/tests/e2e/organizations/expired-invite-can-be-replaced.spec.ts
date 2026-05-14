import { expect, test } from "@playwright/test";
import type PocketBase from "pocketbase";
import type { OrganizationInvitesRecord } from "../../../src/types/pocketbase";
import { waitForMailpitMessage } from "../helpers/mailpit";
import { DEFAULT_AUTH_TEST_PASSWORD, signInUser } from "../helpers/auth";
import {
  createPocketBaseAdminClient,
  createOrganization,
  createOrganizationInvite,
  createVerifiedUser,
  deleteOrganizationGraph,
  deleteSignedUpUsersByEmail,
} from "../helpers/pocketbase-test-admin";
import { createE2ETestRun, createIsolatedTestEmail } from "../helpers/test-run";

test("expired organization invite can be replaced from members settings", async ({ page }) => {
  test.setTimeout(120_000);

  const run = createE2ETestRun();
  const suffix = run.id.slice(-8);
  const ownerEmail = createIsolatedTestEmail(run.id, "organization-owner-expired-invite");
  const invitedEmail = createIsolatedTestEmail(run.id, "organization-expired-invitee");
  const password = DEFAULT_AUTH_TEST_PASSWORD;
  const organizationSlug = `org-expired-invite-${suffix}`;
  const organizationName = `Org Expired Invite ${suffix}`;

  let pb: PocketBase | null = null;

  try {
    pb = await createPocketBaseAdminClient();
    const owner = await createVerifiedUser({ pb, email: ownerEmail, password });
    const { organization } = await createOrganization({
      pb,
      userId: owner.id,
      name: organizationName,
      slug: organizationSlug,
    });
    const expiredInvite = await createOrganizationInvite({
      pb,
      organizationId: organization.id,
      email: invitedEmail,
      role: "member",
      invitedByUserId: owner.id,
      expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    });

    await signInUser({ page, email: ownerEmail, password });
    await expect(page).toHaveURL(/\/cs\/aplikace$/);

    await page.goto(`/cs/o/${organizationSlug}/nastaveni/clenove`);
    await expect(page).toHaveURL(new RegExp(`/cs/o/${organizationSlug}/nastaveni/clenove$`));

    await page.locator("#organization-members-email").fill(invitedEmail);
    await page.getByRole("button", { name: "Pozvat" }).click();

    await expect(page.getByText("Pozvánka byla odeslána.")).toBeVisible();

    await page.getByRole("tab", { name: "Čekající pozvánky" }).click();
    await expect(page.getByText(invitedEmail).first()).toBeVisible();

    await waitForMailpitMessage({
      toEmail: invitedEmail,
      subjectIncludes: organizationName,
      receivedAfter: run.startedAt,
      timeoutMs: 45_000,
    });

    const currentInvites = await pb
      .collection("organization_invites")
      .getFullList<OrganizationInvitesRecord>({
        filter: pb.filter("organization = {:organizationId} && email_normalized = {:email}", {
          organizationId: organization.id,
          email: invitedEmail,
        }),
      });

    expect(currentInvites).toHaveLength(1);
    expect(currentInvites[0].id).not.toBe(expiredInvite.invite.id);
    expect(Date.parse(currentInvites[0].expires_at)).toBeGreaterThan(Date.now());
  } finally {
    if (pb) {
      await deleteOrganizationGraph({
        pb,
        organizationSlug,
      });
      await deleteSignedUpUsersByEmail(pb, ownerEmail);
    }
  }
});
