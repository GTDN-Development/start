import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import type PocketBase from "pocketbase";
import { expectPendingVerifyEmailPage, signInUser, signUpUser } from "../helpers/auth";
import { waitForPocketBaseEmailLinkPath } from "../helpers/mailpit";
import {
  createPocketBaseAdminClient,
  deleteSignedUpUsersByEmail,
} from "../helpers/pocketbase-test-admin";
import { createE2ETestRun, createIsolatedTestEmail } from "../helpers/test-run";

test("user can sign up, verify email, and sign in", async ({ page, browser }) => {
  test.setTimeout(120_000);

  const run = createE2ETestRun();
  const email = createIsolatedTestEmail(run.id, "sign-up");
  const password = "StrongPass123!";

  let pb: PocketBase | null = null;
  let signInContext: BrowserContext | null = null;

  try {
    pb = await createPocketBaseAdminClient();

    await signUpUser({
      page,
      email,
      password,
    });
    await expectPendingVerifyEmailPage(page, email);

    const verificationPath = await waitForVerificationEmailLinkPath({
      page,
      email,
      receivedAfter: run.startedAt,
    });

    await page.goto(verificationPath);
    await expect(page).toHaveURL(/\/cs\/aplikace$/);
    await expect(page.getByRole("link", { name: "Můj účet" })).toBeVisible();

    signInContext = await browser.newContext();
    const signInPage = await signInContext.newPage();

    await signInUser({ page: signInPage, email, password });
    await expect(signInPage).toHaveURL(/\/cs\/aplikace$/);
  } finally {
    if (signInContext) {
      await signInContext.close();
    }

    if (pb) {
      await deleteSignedUpUsersByEmail(pb, email);
    }
  }
});

async function waitForVerificationEmailLinkPath(options: {
  page: Page;
  email: string;
  receivedAfter: Date;
}) {
  try {
    return await waitForPocketBaseEmailLinkPath({
      toEmail: options.email,
      receivedAfter: options.receivedAfter,
      action: "verify-email",
      timeoutMs: 10_000,
    });
  } catch {
    await options.page
      .getByRole("button", {
        name: /^(Poslat ověřovací e-mail znovu|Resend verification email)$/i,
      })
      .click();

    return await waitForPocketBaseEmailLinkPath({
      toEmail: options.email,
      receivedAfter: options.receivedAfter,
      action: "verify-email",
      timeoutMs: 45_000,
    });
  }
}
