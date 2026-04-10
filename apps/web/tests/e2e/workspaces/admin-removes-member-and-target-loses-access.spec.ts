import { expect, test, type BrowserContext } from "@playwright/test";
import type PocketBase from "pocketbase";
import { DEFAULT_AUTH_TEST_PASSWORD, signInUser } from "../helpers/auth";
import {
  createPocketBaseAdminClient,
  createVerifiedUser,
  createWorkspace,
  createWorkspaceMembership,
  deleteSignedUpUsersByEmail,
  deleteWorkspaceGraph,
} from "../helpers/pocketbase-test-admin";
import { getRequiredTestEnv } from "../helpers/test-env";
import { createE2ETestRun, createIsolatedTestEmail } from "../helpers/test-run";
import { removeWorkspaceMember } from "../helpers/workspaces";

test("admin removes a member via UI and the removed user immediately loses access", async ({
  page,
  browser,
}) => {
  test.setTimeout(120_000);

  const run = createE2ETestRun();
  const suffix = run.id.slice(-8);
  const ownerEmail = createIsolatedTestEmail(run.id, "workspace-owner-remove-member");
  const adminEmail = createIsolatedTestEmail(run.id, "workspace-admin-remove-member");
  const memberEmail = createIsolatedTestEmail(run.id, "workspace-member-remove-member");
  const memberName = `Member ${suffix}`;
  const password = DEFAULT_AUTH_TEST_PASSWORD;
  const workspaceSlug = `ws-remove-member-${suffix}`;
  const workspaceName = `Workspace Remove Member ${suffix}`;

  let pb: PocketBase | null = null;
  let memberContext: BrowserContext | null = null;
  let memberId = "";
  let workspaceId = "";

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
    const { workspace } = await createWorkspace({
      pb,
      userId: owner.id,
      name: workspaceName,
      slug: workspaceSlug,
    });

    memberId = member.id;
    workspaceId = workspace.id;

    await createWorkspaceMembership({
      pb,
      workspaceId: workspace.id,
      userId: admin.id,
      role: "admin",
    });
    await createWorkspaceMembership({
      pb,
      workspaceId: workspace.id,
      userId: member.id,
      role: "member",
    });

    memberContext = await browser.newContext();
    const memberPage = await memberContext.newPage();

    await signInUser({ page: memberPage, email: memberEmail, password });
    await expect(memberPage).toHaveURL(/\/cs\/aplikace$/);

    await memberPage.context().addCookies([
      {
        name: "active_workspace",
        value: workspaceSlug,
        url: getRequiredTestEnv("NEXT_PUBLIC_APP_URL"),
      },
    ]);

    await memberPage.goto("/cs/prihlasit-se");
    await expect(memberPage).toHaveURL(new RegExp(`/cs/w/${workspaceSlug}/prehled$`));

    await signInUser({ page, email: adminEmail, password });
    await expect(page).toHaveURL(/\/cs\/aplikace$/);

    await page.goto(`/cs/w/${workspaceSlug}/nastaveni/clenove`);
    await expect(page).toHaveURL(new RegExp(`/cs/w/${workspaceSlug}/nastaveni/clenove$`));

    await removeWorkspaceMember({
      page,
      memberIdentifier: memberName,
    });

    await expect(page.getByText("Člen byl odebrán.")).toBeVisible();
    await expect(page.locator("tbody tr").filter({ hasText: memberName })).toHaveCount(0);

    await memberPage.goto("/cs/prihlasit-se");
    await expect(memberPage).toHaveURL(/\/cs\/aplikace$/);

    await memberPage.goto(`/cs/w/${workspaceSlug}/prehled`);
    await expect(memberPage).toHaveURL(new RegExp(`/cs/w/${workspaceSlug}/prehled$`));
    await expect(memberPage.locator("main:visible")).toContainText("Nenalezeno");

    const memberships = await pb.collection("workspace_members").getFullList({
      filter: pb.filter("workspace = {:workspaceId} && user = {:userId}", {
        workspaceId,
        userId: memberId,
      }),
    });

    expect(memberships).toHaveLength(0);
  } finally {
    if (memberContext) {
      await memberContext.close();
    }

    if (pb) {
      await deleteWorkspaceGraph({
        pb,
        workspaceSlug,
      });
      await deleteSignedUpUsersByEmail(pb, ownerEmail);
      await deleteSignedUpUsersByEmail(pb, adminEmail);
      await deleteSignedUpUsersByEmail(pb, memberEmail);
    }
  }
});
