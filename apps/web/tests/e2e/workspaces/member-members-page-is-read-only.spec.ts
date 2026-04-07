import { expect, test } from "@playwright/test";
import type PocketBase from "pocketbase";
import type { WorkspaceMembersRecord } from "../../../src/types/pocketbase";
import { DEFAULT_AUTH_TEST_PASSWORD, signInUser } from "../helpers/auth";
import {
  createPocketBaseAdminClient,
  createWorkspace,
  createVerifiedUser,
  createWorkspaceInvite,
  deleteSignedUpUsersByEmail,
  deleteWorkspaceGraph,
} from "../helpers/pocketbase-test-admin";
import { createE2ETestRun, createIsolatedTestEmail } from "../helpers/test-run";

test("member opens members page in read-only mode", async ({ page }) => {
  test.setTimeout(120_000);

  const run = createE2ETestRun();
  const suffix = run.id.slice(-8);
  const ownerEmail = createIsolatedTestEmail(run.id, "workspace-owner-member-view");
  const memberEmail = createIsolatedTestEmail(run.id, "workspace-member-view");
  const pendingInviteEmail = createIsolatedTestEmail(run.id, "workspace-pending-invite");
  const password = DEFAULT_AUTH_TEST_PASSWORD;
  const ownerName = `Workspace Owner ${suffix}`;
  const memberName = `Workspace Member ${suffix}`;
  const workspaceSlug = `ws-member-view-${suffix}`;
  const workspaceName = `Workspace Members ${suffix}`;

  let pb: PocketBase | null = null;

  try {
    pb = await createPocketBaseAdminClient();
    const owner = await createVerifiedUser({ pb, email: ownerEmail, password, name: ownerName });
    const member = await createVerifiedUser({ pb, email: memberEmail, password, name: memberName });

    const { workspace } = await createWorkspace({
      pb,
      userId: owner.id,
      name: workspaceName,
      slug: workspaceSlug,
    });

    await pb.collection("workspace_members").create<WorkspaceMembersRecord>({
      workspace: workspace.id,
      user: member.id,
      role: "member",
    });

    await createWorkspaceInvite({
      pb,
      workspaceId: workspace.id,
      email: pendingInviteEmail,
      role: "member",
      invitedByUserId: owner.id,
    });

    await signInUser({ page, email: memberEmail, password });
    await expect(page).toHaveURL(/\/cs\/aplikace$/);

    await page.goto(`/cs/w/${workspaceSlug}/nastaveni/clenove`);

    await expect(page).toHaveURL(new RegExp(`/cs/w/${workspaceSlug}/nastaveni/clenove$`));
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
      await deleteWorkspaceGraph({
        pb,
        workspaceSlug,
      });
      await deleteSignedUpUsersByEmail(pb, ownerEmail);
      await deleteSignedUpUsersByEmail(pb, memberEmail);
    }
  }
});
