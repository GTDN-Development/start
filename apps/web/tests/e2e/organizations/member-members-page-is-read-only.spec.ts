import { expect, test } from "@playwright/test";
import type PocketBase from "pocketbase";
import type { OrganizationMembersRecord } from "../../../src/types/pocketbase";
import { DEFAULT_AUTH_TEST_PASSWORD, signInUser } from "../helpers/auth";
import {
  createPocketBaseAdminClient,
  createOrganization,
  createVerifiedUser,
  createOrganizationInvite,
  deleteSignedUpUsersByEmail,
  deleteOrganizationGraph,
} from "../helpers/pocketbase-test-admin";
import { createE2ETestRun, createIsolatedTestEmail } from "../helpers/test-run";

test("member opens members page in read-only mode", async ({ page }) => {
  test.setTimeout(120_000);

  const run = createE2ETestRun();
  const suffix = run.id.slice(-8);
  const ownerEmail = createIsolatedTestEmail(run.id, "organization-owner-member-view");
  const memberEmail = createIsolatedTestEmail(run.id, "organization-member-view");
  const pendingInviteEmail = createIsolatedTestEmail(run.id, "organization-pending-invite");
  const password = DEFAULT_AUTH_TEST_PASSWORD;
  const ownerName = `Organization Owner ${suffix}`;
  const memberName = `Organization Member ${suffix}`;
  const organizationSlug = `ws-member-view-${suffix}`;
  const organizationName = `Organization Members ${suffix}`;

  let pb: PocketBase | null = null;

  try {
    pb = await createPocketBaseAdminClient();
    const owner = await createVerifiedUser({ pb, email: ownerEmail, password, name: ownerName });
    const member = await createVerifiedUser({ pb, email: memberEmail, password, name: memberName });

    const { organization } = await createOrganization({
      pb,
      userId: owner.id,
      name: organizationName,
      slug: organizationSlug,
    });

    await pb.collection("organization_members").create<OrganizationMembersRecord>({
      organization: organization.id,
      user: member.id,
      role: "member",
    });

    await createOrganizationInvite({
      pb,
      organizationId: organization.id,
      email: pendingInviteEmail,
      role: "member",
      invitedByUserId: owner.id,
    });

    await signInUser({ page, email: memberEmail, password });
    await expect(page).toHaveURL(/\/cs\/aplikace$/);

    await page.goto(`/cs/o/${organizationSlug}/nastaveni/clenove`);

    await expect(page).toHaveURL(new RegExp(`/cs/o/${organizationSlug}/nastaveni/clenove$`));
    await expect(
      page
        .locator("tbody tr")
        .filter({
          hasText: ownerName,
        })
        .filter({
          hasText: "Vlastník",
        })
        .first()
    ).toBeVisible();
    await expect(
      page
        .locator("tbody tr")
        .filter({
          hasText: memberEmail,
        })
        .filter({
          hasText: "Člen",
        })
        .first()
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Pozvat" })).toBeDisabled();
    await expect(
      page.getByText("Na úpravu tohoto nastavení nemáte dostatečná práva.").first()
    ).toBeVisible();

    await page.getByRole("tab", { name: "Čekající pozvánky" }).click();

    await expect(page.getByText("Žádné čekající pozvánky")).toBeVisible();
    await expect(page.getByText("Všechny pozvánky byly přijaty nebo expirovaly.")).toBeVisible();
    await expect(page.getByText(pendingInviteEmail)).toHaveCount(0);
  } finally {
    if (pb) {
      await deleteOrganizationGraph({
        pb,
        organizationSlug,
      });
      await deleteSignedUpUsersByEmail(pb, ownerEmail);
      await deleteSignedUpUsersByEmail(pb, memberEmail);
    }
  }
});
