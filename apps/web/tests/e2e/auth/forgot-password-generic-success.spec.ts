import { expect, test } from "@playwright/test";
import type PocketBase from "pocketbase";
import { DEFAULT_AUTH_TEST_PASSWORD, requestPasswordReset } from "../helpers/auth";
import { waitForPocketBaseEmailLinkPath } from "../helpers/mailpit";
import {
  createPocketBaseAdminClient,
  createVerifiedUser,
  deleteSignedUpUsersByEmail,
} from "../helpers/pocketbase-test-admin";
import { createE2ETestRun, createIsolatedTestEmail } from "../helpers/test-run";

test("forgot-password shows the same success state for known and unknown email", async ({
  page,
}) => {
  test.setTimeout(120_000);

  const run = createE2ETestRun();
  const knownEmail = createIsolatedTestEmail(run.id, "forgot-password-known");
  const unknownEmail = createIsolatedTestEmail(run.id, "forgot-password-unknown");
  const password = DEFAULT_AUTH_TEST_PASSWORD;

  let pb: PocketBase | null = null;

  try {
    pb = await createPocketBaseAdminClient();
    await createVerifiedUser({ pb, email: knownEmail, password });

    await requestPasswordReset({
      page,
      email: knownEmail,
    });
    await expectForgotPasswordSuccessState(page);

    await waitForPocketBaseEmailLinkPath({
      toEmail: knownEmail,
      receivedAfter: run.startedAt,
      action: "reset-password",
      timeoutMs: 45_000,
    });

    await requestPasswordReset({
      page,
      email: unknownEmail,
    });
    await expectForgotPasswordSuccessState(page);
  } finally {
    if (pb) {
      await deleteSignedUpUsersByEmail(pb, knownEmail);
    }
  }
});

async function expectForgotPasswordSuccessState(
  page: Parameters<typeof requestPasswordReset>[0]["page"]
): Promise<void> {
  await expect(page).toHaveURL(/\/cs\/zapomenute-heslo$/);
  await expect(page.getByText("Zkontrolujte e-mail")).toBeVisible();
  await expect(
    page.getByText("Pokud účet s tímto e-mailem existuje, poslali jsme odkaz pro obnovu hesla.")
  ).toBeVisible();
}
