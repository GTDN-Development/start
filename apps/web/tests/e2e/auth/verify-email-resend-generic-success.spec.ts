import { expect, test } from "@playwright/test";
import { createE2ETestRun, createIsolatedTestEmail } from "../helpers/test-run";

test("verification resend shows generic success for an unknown email", async ({ page }) => {
  const run = createE2ETestRun();
  const unknownEmail = createIsolatedTestEmail(run.id, "verify-resend-unknown");

  await page.goto(`/cs/overit-email?email=${encodeURIComponent(unknownEmail)}`);
  await page.getByRole("button", { name: "Poslat ověřovací e-mail znovu" }).click();

  await expect(page).toHaveURL(
    new RegExp(`/cs/overit-email\\?email=${encodeURIComponent(unknownEmail)}`)
  );
  await expect(page.getByRole("heading", { name: "Zkontrolujte e-mail" })).toBeVisible();
  await expect(
    page.getByText(
      "Pokud tato e-mailová adresa existuje a stále čeká na ověření, poslali jsme nový ověřovací e-mail."
    )
  ).toBeVisible();
});
