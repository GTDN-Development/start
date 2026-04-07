import { expect, test } from "@playwright/test";
import { expectSignInPage } from "../helpers/auth";

test("invalid invite link shows blocked state and recoverable sign-in path", async ({ page }) => {
  const invalidToken = "nonexistent-invite-token";

  await page.goto(`/cs/invite/${invalidToken}`);

  await expect(page).toHaveURL(new RegExp(`/cs/invite/${invalidToken}$`));
  await expect(page.getByRole("heading", { name: "Pozvánka není dostupná" })).toBeVisible();
  await expect(
    page.getByText(
      "Tuto pozvánku už nelze použít. Může být neplatná, expirovaná, zrušená, nedostupná nebo už použitá."
    )
  ).toBeVisible();

  await page.getByRole("button", { name: "Přejít na přihlášení" }).click();

  await expectSignInPage(page);
});
