import { expect, test } from "@playwright/test";
import type PocketBase from "pocketbase";
import {
  DEFAULT_AUTH_TEST_PASSWORD,
  expectSignInPage,
  requestPasswordReset,
  resetPassword,
  signInUser,
} from "../helpers/auth";
import { waitForPocketBaseEmailLinkPath } from "../helpers/mailpit";
import {
  createPocketBaseAdminClient,
  createVerifiedUser,
  deleteSignedUpUsersByEmail,
} from "../helpers/pocketbase-test-admin";
import { createE2ETestRun, createIsolatedTestEmail } from "../helpers/test-run";

test("reset password succeeds and the user must sign in again", async ({ page }) => {
  test.setTimeout(120_000);

  const run = createE2ETestRun();
  const email = createIsolatedTestEmail(run.id, "reset-password-success");
  const password = DEFAULT_AUTH_TEST_PASSWORD;
  const newPassword = "EvenStrongerPass123!";

  let pb: PocketBase | null = null;

  try {
    pb = await createPocketBaseAdminClient();
    await createVerifiedUser({ pb, email, password });

    await requestPasswordReset({ page, email });
    await expect(
      page.getByText("Pokud účet s tímto e-mailem existuje, poslali jsme odkaz pro obnovu hesla.")
    ).toBeVisible();

    const resetPasswordPath = await waitForPocketBaseEmailLinkPath({
      toEmail: email,
      receivedAfter: run.startedAt,
      action: "reset-password",
      timeoutMs: 45_000,
    });

    await signInUser({ page, email, password });
    await expect(page).toHaveURL(/\/cs\/aplikace$/);

    await page.goto(resetPasswordPath);
    await resetPassword({
      page,
      password: newPassword,
    });

    await expectSignInPage(page);

    await page.goto("/cs/aplikace");
    await expectSignInPage(page);

    await signInUser({ page, email, password: newPassword });
    await expect(page).toHaveURL(/\/cs\/aplikace$/);
  } finally {
    if (pb) {
      await deleteSignedUpUsersByEmail(pb, email);
    }
  }
});
