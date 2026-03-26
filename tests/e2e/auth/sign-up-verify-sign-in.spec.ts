import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import type PocketBase from "pocketbase";
import {
  extractPocketBaseEmailLinkPath,
  getMailtrapMessageHtml,
  waitForMailtrapMessage,
} from "../helpers/mailtrap";
import {
  createPocketBaseAdminClient,
  listPocketBaseRecordsByPrefix,
} from "../helpers/pocketbase-admin";
import { createE2ETestRun, createIsolatedTestEmail } from "../helpers/test-run";

test("user can sign up, verify email, and sign in", async ({ page, browser }) => {
  test.setTimeout(120_000);

  const run = createE2ETestRun();
  const email = createIsolatedTestEmail(run.id, "sign-up");
  const password = "StrongPass123!";
  const firstName = "E2E";
  const lastName = "User";

  let pb: PocketBase | null = null;
  let signInContext: BrowserContext | null = null;

  try {
    pb = await createPocketBaseAdminClient();

    await page.goto("/cs/registrace");

    await page.locator("#signup-firstName").fill(firstName);
    await page.locator("#signup-lastName").fill(lastName);
    await page.locator("#signup-email").fill(email);
    await page.locator("#signup-password").fill(password);
    await page.locator("form button[type=\"submit\"]").click();

    await expect(page).toHaveURL(/\/cs\/overit-email\?email=/);
    await expect(page.getByText(email)).toBeVisible();

    const verificationMessage = await waitForVerificationEmail({
      page,
      email,
      receivedAfter: run.startedAt,
    });
    const verificationHtml = await getMailtrapMessageHtml(verificationMessage.id);
    const verificationPath = extractPocketBaseEmailLinkPath({
      html: verificationHtml,
      action: "verify-email",
    });

    await page.goto(verificationPath);
    await expect(page).toHaveURL(/\/cs\/overit-email\?result=verified/);
    await expect(page.getByRole("heading", { name: /^E-mail ověřen$/i })).toBeVisible();

    signInContext = await browser.newContext();
    const signInPage = await signInContext.newPage();

    await signInPage.goto("/cs/prihlasit-se");
    await signInPage.locator("#sign-in-email").fill(email);
    await signInPage.locator("#sign-in-password").fill(password);
    await signInPage.locator("form button[type=\"submit\"]").click();

    await expect(signInPage).toHaveURL(/\/cs\/aplikace$/);
  } finally {
    if (signInContext) {
      await signInContext.close();
    }

    if (pb) {
      await cleanupSignedUpUser(pb, email);
    }
  }
});

async function waitForVerificationEmail(options: {
  page: Page;
  email: string;
  receivedAfter: Date;
}) {
  try {
    return await waitForMailtrapMessage({
      toEmail: options.email,
      receivedAfter: options.receivedAfter,
      timeoutMs: 10_000,
    });
  } catch {
    await options.page
      .getByRole("button", {
        name: /^(Poslat ověřovací e-mail znovu|Resend verification email)$/i,
      })
      .click();

    return await waitForMailtrapMessage({
      toEmail: options.email,
      receivedAfter: options.receivedAfter,
      timeoutMs: 45_000,
    });
  }
}

async function cleanupSignedUpUser(pb: PocketBase, email: string): Promise<void> {
  const users = await listPocketBaseRecordsByPrefix({
    pb,
    collection: "users",
    field: "email",
    prefix: email,
  });

  for (const user of users) {
    await deleteUserDeviceSessions(pb, user.id);
    await pb.collection("users").delete(user.id);
  }
}

async function deleteUserDeviceSessions(pb: PocketBase, userId: string): Promise<void> {
  const deviceSessions = await pb.collection("user_device_sessions").getFullList({
    filter: pb.filter("user = {:userId}", {
      userId,
    }),
  });

  for (const deviceSession of deviceSessions) {
    await pb.collection("user_device_sessions").delete(deviceSession.id);
  }
}
