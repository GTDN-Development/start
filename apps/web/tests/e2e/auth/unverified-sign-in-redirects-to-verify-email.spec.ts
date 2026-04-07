import { expect, test } from "@playwright/test";
import type PocketBase from "pocketbase";
import type { UsersRecord } from "../../../src/types/pocketbase";
import { DEFAULT_AUTH_TEST_PASSWORD, signInUser } from "../helpers/auth";
import {
  createPocketBaseAdminClient,
  deleteSignedUpUsersByEmail,
} from "../helpers/pocketbase-test-admin";
import { createE2ETestRun, createIsolatedTestEmail } from "../helpers/test-run";

test("unverified user signing in is sent to verify email without automatic resend", async ({
  page,
}) => {
  const run = createE2ETestRun();
  const email = createIsolatedTestEmail(run.id, "unverified-sign-in");
  const password = DEFAULT_AUTH_TEST_PASSWORD;

  let pb: PocketBase | null = null;

  try {
    pb = await createPocketBaseAdminClient();
    await pb.collection("users").create<UsersRecord>({
      email,
      password,
      passwordConfirm: password,
      name: "Unverified User",
      verified: false,
    });

    await signInUser({ page, email, password });

    await expect(page).toHaveURL(
      new RegExp(`/cs/overit-email\\?email=${encodeURIComponent(email)}$`)
    );
    await expect(page.getByText(email)).toBeVisible();
    await expect(page.getByText("Ověřovací e-mail posíláme na")).toBeVisible();
    await expect(
      page.getByText(
        "Pokud tato e-mailová adresa existuje a stále čeká na ověření, poslali jsme nový ověřovací e-mail."
      )
    ).toHaveCount(0);
  } finally {
    if (pb) {
      await deleteSignedUpUsersByEmail(pb, email);
    }
  }
});
