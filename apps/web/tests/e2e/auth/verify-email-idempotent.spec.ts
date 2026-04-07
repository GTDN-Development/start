import { expect, test } from "@playwright/test";
import type PocketBase from "pocketbase";
import { DEFAULT_AUTH_TEST_PASSWORD, signUpUser } from "../helpers/auth";
import { waitForPocketBaseEmailLinkPath } from "../helpers/mailpit";
import {
  createPocketBaseAdminClient,
  deleteSignedUpUsersByEmail,
} from "../helpers/pocketbase-test-admin";
import { createE2ETestRun, createIsolatedTestEmail } from "../helpers/test-run";

test("email verification is idempotent for an already verified email", async ({ page }) => {
  test.setTimeout(120_000);

  const run = createE2ETestRun();
  const email = createIsolatedTestEmail(run.id, "verify-idempotent");

  let pb: PocketBase | null = null;

  try {
    pb = await createPocketBaseAdminClient();

    await signUpUser({
      page,
      email,
      password: DEFAULT_AUTH_TEST_PASSWORD,
    });
    await expect(page).toHaveURL(/\/cs\/overit-email\?email=/);

    const verificationPath = await waitForPocketBaseEmailLinkPath({
      toEmail: email,
      receivedAfter: run.startedAt,
      action: "verify-email",
      timeoutMs: 45_000,
    });

    await page.goto(verificationPath);
    await expect(page).toHaveURL(/\/cs\/aplikace$/);
    await expect(page.getByRole("link", { name: "Můj účet" })).toBeVisible();

    await page.goto(verificationPath);
    await expect(page).toHaveURL(/\/cs\/aplikace$/);
    await expect(page.getByRole("link", { name: "Můj účet" })).toBeVisible();
  } finally {
    if (pb) {
      await deleteSignedUpUsersByEmail(pb, email);
    }
  }
});
