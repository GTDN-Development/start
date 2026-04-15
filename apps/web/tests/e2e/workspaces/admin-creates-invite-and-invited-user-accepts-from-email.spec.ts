import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import type PocketBase from "pocketbase";
import type { WorkspaceMembersRecord } from "../../../src/types/pocketbase";
import {
  decodeHtmlAttribute,
  getMailpitMessageHtml,
  waitForMailpitMessage,
} from "../helpers/mailpit";
import { DEFAULT_AUTH_TEST_PASSWORD, expectSignInPage, signInUser } from "../helpers/auth";
import {
  createPocketBaseAdminClient,
  createWorkspace,
  createVerifiedUser,
  deleteSignedUpUsersByEmail,
  deleteWorkspaceGraph,
} from "../helpers/pocketbase-test-admin";
import { getRequiredTestEnv } from "../helpers/test-env";
import { createE2ETestRun, createIsolatedTestEmail } from "../helpers/test-run";
import { acceptWorkspaceInvite } from "../helpers/workspaces";

test("admin creates invite from UI and invited user accepts it from email", async ({
  page,
  browser,
}) => {
  test.setTimeout(120_000);

  const run = createE2ETestRun();
  const suffix = run.id.slice(-8);
  const ownerEmail = createIsolatedTestEmail(run.id, "workspace-owner-ui-invite");
  const adminEmail = createIsolatedTestEmail(run.id, "workspace-admin-ui-invite");
  const invitedEmail = createIsolatedTestEmail(run.id, "workspace-invited-ui-invite");
  const password = DEFAULT_AUTH_TEST_PASSWORD;
  const workspaceSlug = `ws-ui-invite-${suffix}`;
  const workspaceName = `Workspace UI Invite ${suffix}`;

  let pb: PocketBase | null = null;
  let invitedContext: BrowserContext | null = null;

  try {
    pb = await createPocketBaseAdminClient();
    const owner = await createVerifiedUser({ pb, email: ownerEmail, password });
    const admin = await createVerifiedUser({ pb, email: adminEmail, password });
    await createVerifiedUser({ pb, email: invitedEmail, password });

    const { workspace } = await createWorkspace({
      pb,
      userId: owner.id,
      name: workspaceName,
      slug: workspaceSlug,
    });

    await pb.collection("workspace_members").create<WorkspaceMembersRecord>({
      workspace: workspace.id,
      user: admin.id,
      role: "admin",
    });

    await signInUser({ page, email: adminEmail, password });
    await expect(page).toHaveURL(/\/cs\/aplikace$/);

    await page.goto(`/cs/w/${workspaceSlug}/nastaveni/clenove`);
    await expect(page).toHaveURL(new RegExp(`/cs/w/${workspaceSlug}/nastaveni/clenove$`));

    await page.locator("#workspace-members-email").fill(invitedEmail);
    await page.getByRole("button", { name: "Pozvat" }).click();

    await expect(page.getByText("Pozvánka byla odeslána.")).toBeVisible();

    await page.getByRole("tab", { name: "Čekající pozvánky" }).click();
    await expect(page.getByText(invitedEmail).first()).toBeVisible();

    const message = await waitForMailpitMessage({
      toEmail: invitedEmail,
      subjectIncludes: workspaceName,
      receivedAfter: run.startedAt,
      timeoutMs: 45_000,
    });
    const html = await getMailpitMessageHtml(message.ID);
    const invitePath = extractWorkspaceInvitePathFromHtml(html);

    invitedContext = await browser.newContext();
    const invitedPage = await invitedContext.newPage();

    await invitedPage.goto(invitePath);
    await expectSignInPage(invitedPage);

    await signInUser({ page: invitedPage, email: invitedEmail, password });
    await expect(invitedPage).toHaveURL(/\/cs\/invite\/[^/]+$/);
    await expect(
      invitedPage.getByRole("heading", { name: "Připojit se do workspace" })
    ).toBeVisible();
    await expect(invitedPage.getByText(workspaceName)).toBeVisible();

    await copySessionCookiesToLocalhost(invitedPage);
    await acceptWorkspaceInvite({ page: invitedPage, email: invitedEmail });

    await expect(invitedPage).toHaveURL(new RegExp(`/cs/w/${workspaceSlug}/prehled$`));
  } finally {
    if (invitedContext) {
      await invitedContext.close();
    }

    if (pb) {
      await deleteWorkspaceGraph({
        pb,
        workspaceSlug,
      });
      await deleteSignedUpUsersByEmail(pb, ownerEmail);
      await deleteSignedUpUsersByEmail(pb, adminEmail);
      await deleteSignedUpUsersByEmail(pb, invitedEmail);
    }
  }
});

function extractWorkspaceInvitePathFromHtml(html: string): string {
  const hrefValues = Array.from(html.matchAll(/href=(["'])(.*?)\1/gi)).map(
    function mapHrefMatch(match) {
      return decodeHtmlAttribute(match[2] ?? "");
    }
  );

  for (const hrefValue of hrefValues) {
    const parsedUrl = tryParseInviteUrl(hrefValue);

    if (parsedUrl && parsedUrl.pathname.startsWith("/cs/invite/")) {
      const searchValue = parsedUrl.searchParams.toString();

      return searchValue ? `${parsedUrl.pathname}?${searchValue}` : parsedUrl.pathname;
    }
  }

  throw new Error("Unable to resolve workspace invite path from Mailpit HTML.");
}

function tryParseInviteUrl(value: string): URL | null {
  try {
    return new URL(value, getRequiredTestEnv("NEXT_PUBLIC_APP_URL"));
  } catch {
    return null;
  }
}

async function copySessionCookiesToLocalhost(page: Page): Promise<void> {
  const sessionCookieNames = new Set(["pb_auth", "pb_auth_persist", "app_device_session"]);
  const sessionCookies = (await page.context().cookies()).filter((cookie) =>
    sessionCookieNames.has(cookie.name)
  );

  await page.context().addCookies(
    sessionCookies.map((cookie) => ({
      name: cookie.name,
      value: cookie.value,
      url: getRequiredTestEnv("NEXT_PUBLIC_APP_URL"),
      expires: cookie.expires,
      httpOnly: cookie.httpOnly,
      secure: cookie.secure,
      sameSite: cookie.sameSite,
    }))
  );
}
