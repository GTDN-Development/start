import { expect, test, type BrowserContext } from "@playwright/test";
import type PocketBase from "pocketbase";
import { DEFAULT_AUTH_TEST_PASSWORD, signInUser } from "../helpers/auth";
import {
  createPocketBaseAdminClient,
  createVerifiedUser,
  createOrganization,
  createOrganizationMembership,
  deleteSignedUpUsersByEmail,
  deleteOrganizationGraph,
} from "../helpers/pocketbase-test-admin";
import { getRequiredTestEnv } from "../helpers/test-env";
import { createE2ETestRun, createIsolatedTestEmail } from "../helpers/test-run";
import { removeOrganizationMember } from "../helpers/organizations";

test("admin removes a member via UI and the removed user immediately loses access", async ({
  page,
  browser,
}) => {
  test.setTimeout(120_000);

  const run = createE2ETestRun();
  const suffix = run.id.slice(-8);
  const ownerEmail = createIsolatedTestEmail(run.id, "organization-owner-remove-member");
  const adminEmail = createIsolatedTestEmail(run.id, "organization-admin-remove-member");
  const memberEmail = createIsolatedTestEmail(run.id, "organization-member-remove-member");
  const memberName = `Member ${suffix}`;
  const password = DEFAULT_AUTH_TEST_PASSWORD;
  const organizationSlug = `ws-remove-member-${suffix}`;
  const organizationName = `Organization Remove Member ${suffix}`;

  let pb: PocketBase | null = null;
  let memberContext: BrowserContext | null = null;
  let memberId = "";
  let organizationId = "";

  try {
    pb = await createPocketBaseAdminClient();
    const owner = await createVerifiedUser({
      pb,
      email: ownerEmail,
      password,
      name: `Owner ${suffix}`,
    });
    const admin = await createVerifiedUser({
      pb,
      email: adminEmail,
      password,
      name: `Admin ${suffix}`,
    });
    const member = await createVerifiedUser({
      pb,
      email: memberEmail,
      password,
      name: memberName,
    });
    const { organization } = await createOrganization({
      pb,
      userId: owner.id,
      name: organizationName,
      slug: organizationSlug,
    });

    memberId = member.id;
    organizationId = organization.id;

    await createOrganizationMembership({
      pb,
      organizationId: organization.id,
      userId: admin.id,
      role: "admin",
    });
    await createOrganizationMembership({
      pb,
      organizationId: organization.id,
      userId: member.id,
      role: "member",
    });

    memberContext = await browser.newContext();
    const memberPage = await memberContext.newPage();

    await signInUser({ page: memberPage, email: memberEmail, password });
    await expect(memberPage).toHaveURL(/\/cs\/aplikace$/);

    await memberPage.context().addCookies([
      {
        name: "active_organization",
        value: organizationSlug,
        url: getRequiredTestEnv("NEXT_PUBLIC_APP_URL"),
      },
    ]);

    await memberPage.goto("/cs/prihlasit-se");
    await expect(memberPage).toHaveURL(new RegExp(`/cs/o/${organizationSlug}/prehled$`));

    await signInUser({ page, email: adminEmail, password });
    await expect(page).toHaveURL(/\/cs\/aplikace$/);

    await page.goto(`/cs/o/${organizationSlug}/nastaveni/clenove`);
    await expect(page).toHaveURL(new RegExp(`/cs/o/${organizationSlug}/nastaveni/clenove$`));

    await removeOrganizationMember({
      page,
      memberIdentifier: memberName,
    });

    await expect(page.getByText("Člen byl odebrán.")).toBeVisible();
    await expect(page.locator("tbody tr").filter({ hasText: memberName })).toHaveCount(0);

    await memberPage.goto("/cs/prihlasit-se");
    await expect(memberPage).toHaveURL(/\/cs\/aplikace$/);

    await memberPage.goto(`/cs/o/${organizationSlug}/prehled`);
    await expect(memberPage).toHaveURL(new RegExp(`/cs/o/${organizationSlug}/prehled$`));
    await expect(memberPage.locator("main:visible")).toContainText("Nenalezeno");

    const memberships = await pb.collection("organization_members").getFullList({
      filter: pb.filter("organization = {:organizationId} && user = {:userId}", {
        organizationId,
        userId: memberId,
      }),
    });

    expect(memberships).toHaveLength(0);
  } finally {
    if (memberContext) {
      await memberContext.close();
    }

    if (pb) {
      await deleteOrganizationGraph({
        pb,
        organizationSlug,
      });
      await deleteSignedUpUsersByEmail(pb, ownerEmail);
      await deleteSignedUpUsersByEmail(pb, adminEmail);
      await deleteSignedUpUsersByEmail(pb, memberEmail);
    }
  }
});
