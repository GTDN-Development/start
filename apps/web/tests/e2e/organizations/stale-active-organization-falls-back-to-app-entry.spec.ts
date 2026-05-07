import { expect, test } from "@playwright/test";
import type PocketBase from "pocketbase";
import type { OrganizationMembersRecord } from "../../../src/types/pocketbase";
import { DEFAULT_AUTH_TEST_PASSWORD, signInUser } from "../helpers/auth";
import {
  createPocketBaseAdminClient,
  createOrganization,
  createVerifiedUser,
  deleteSignedUpUsersByEmail,
  deleteOrganizationGraph,
} from "../helpers/pocketbase-test-admin";
import { getRequiredTestEnv } from "../helpers/test-env";
import { createE2ETestRun, createIsolatedTestEmail } from "../helpers/test-run";

test("stale active organization falls back to personal app entry after external access loss", async ({
  page,
}) => {
  test.setTimeout(120_000);

  const run = createE2ETestRun();
  const suffix = run.id.slice(-8);
  const ownerEmail = createIsolatedTestEmail(run.id, "organization-owner-stale");
  const memberEmail = createIsolatedTestEmail(run.id, "organization-member-stale");
  const password = DEFAULT_AUTH_TEST_PASSWORD;
  const organizationSlug = `org-stale-${suffix}`;
  const organizationName = `Organization Stale ${suffix}`;

  let pb: PocketBase | null = null;
  let memberMembership: OrganizationMembersRecord | null = null;

  try {
    pb = await createPocketBaseAdminClient();
    const owner = await createVerifiedUser({ pb, email: ownerEmail, password });
    const member = await createVerifiedUser({ pb, email: memberEmail, password });

    const { organization } = await createOrganization({
      pb,
      userId: owner.id,
      name: organizationName,
      slug: organizationSlug,
    });

    memberMembership = await pb
      .collection("organization_members")
      .create<OrganizationMembersRecord>({
        organization: organization.id,
        user: member.id,
        role: "member",
      });

    await signInUser({ page, email: memberEmail, password });
    await expect(page).toHaveURL(/\/cs\/aplikace$/);

    await page.context().addCookies([
      {
        name: "active_organization",
        value: organizationSlug,
        url: getRequiredTestEnv("NEXT_PUBLIC_APP_URL"),
      },
    ]);

    await page.goto("/cs/prihlasit-se");
    await expect(page).toHaveURL(new RegExp(`/cs/o/${organizationSlug}/prehled$`));

    await pb.collection("organization_members").delete(memberMembership.id);
    memberMembership = null;

    await page.goto("/cs/prihlasit-se");
    await expect(page).toHaveURL(/\/cs\/aplikace$/);
    await expect(page).not.toHaveURL(new RegExp(`/cs/o/${organizationSlug}/prehled$`));
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
