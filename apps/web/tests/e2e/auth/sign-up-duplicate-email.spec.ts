import { expect, test } from "@playwright/test";
import type PocketBase from "pocketbase";
import { DEFAULT_AUTH_TEST_PASSWORD, signUpUser } from "../helpers/auth";
import {
  createVerifiedUser,
  createPocketBaseAdminClient,
  deleteSignedUpUsersByEmail,
} from "../helpers/pocketbase-test-admin";
import { createE2ETestRun, createIsolatedTestEmail } from "../helpers/test-run";

test("sign-up with existing email stays on sign-up and shows explicit duplicate-email error", async ({
  page,
}) => {
  test.setTimeout(120_000);

  const run = createE2ETestRun();
  const email = createIsolatedTestEmail(run.id, "duplicate-sign-up");
  const password = DEFAULT_AUTH_TEST_PASSWORD;

  let pb: PocketBase | null = null;

  try {
    pb = await createPocketBaseAdminClient();
    await createVerifiedUser({ pb, email, password, name: "Existing User" });
    await signUpUser({
      page,
      email,
      password,
      firstName: "Existing",
      lastName: "User",
    });

    await expect(page).toHaveURL(/\/cs\/registrace$/);
    await expect(page.getByText("Registrace selhala")).toBeVisible();
    await expect(page.getByText("Tato e-mailová adresa je již používaná.")).toBeVisible();
  } finally {
    if (pb) {
      await deleteSignedUpUsersByEmail(pb, email);
    }
  }
});
