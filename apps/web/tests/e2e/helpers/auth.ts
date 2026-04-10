import { expect, type Page } from "@playwright/test";

export const DEFAULT_AUTH_TEST_PASSWORD = "StrongPass123!";

export async function signUpUser(options: {
  page: Page;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}): Promise<void> {
  await options.page.goto("/cs/registrace");
  await options.page.locator("#signup-firstName").fill(options.firstName ?? "E2E");
  await options.page.locator("#signup-lastName").fill(options.lastName ?? "User");
  await options.page.locator("#signup-email").fill(options.email);
  await options.page.locator("#signup-password").fill(options.password);
  await options.page.locator('form button[type="submit"]').click();
}

export async function signInUser(options: {
  page: Page;
  email: string;
  password: string;
}): Promise<void> {
  await options.page.goto("/cs/prihlasit-se");
  await options.page.locator("#sign-in-email").fill(options.email);
  await options.page.locator("#sign-in-password").fill(options.password);
  await options.page.locator('form button[type="submit"]').click();
}

export async function requestPasswordReset(options: { page: Page; email: string }): Promise<void> {
  await options.page.goto("/cs/zapomenute-heslo");
  await options.page.locator("#forgot-password-email").fill(options.email);
  await options.page.locator('form button[type="submit"]').click();
}

export async function resetPassword(options: {
  page: Page;
  password: string;
  confirmPassword?: string;
}): Promise<void> {
  await options.page.locator("#reset-password-password").fill(options.password);
  await options.page
    .locator("#reset-password-confirmPassword")
    .fill(options.confirmPassword ?? options.password);
  await options.page.locator('form button[type="submit"]').click();
}

export async function expectPendingVerifyEmailPage(page: Page, email: string): Promise<void> {
  await expect(page).toHaveURL(/\/cs\/overit-email\?email=/);
  await expect(page.getByText(email)).toBeVisible();
}

export async function expectSignInPage(page: Page): Promise<void> {
  await expect(page).toHaveURL(/\/cs\/prihlasit-se$/);
  await expect(page.locator("#sign-in-email")).toBeVisible();
  await expect(page.locator("#sign-in-password")).toBeVisible();
}

export async function openAccountEmailChangeDialog(page: Page): Promise<void> {
  await page.goto("/cs/ucet");
  await expect(page).toHaveURL(/\/cs\/ucet$/);

  const openDialogButton = page.getByRole("button", { name: "Změnit e-mail" });

  await expect(openDialogButton).toBeVisible();
  await openDialogButton.click();
  await expect(page.locator("#account-email-change-newEmail")).toBeVisible();
}

export async function requestAccountEmailChange(options: {
  page: Page;
  newEmail: string;
}): Promise<void> {
  await openAccountEmailChangeDialog(options.page);
  await options.page.locator("#account-email-change-newEmail").fill(options.newEmail);
  await options.page
    .getByRole("checkbox", {
      name: "Rozumím, že tento e-mail bude mít přístup k mému účtu.",
    })
    .check();
  await options.page.getByRole("button", { name: "Odeslat potvrzovací odkaz" }).click();
}

export async function openAccountSecurityPage(page: Page): Promise<void> {
  await page.goto("/cs/ucet/zabezpeceni");
  await expect(page).toHaveURL(/\/cs\/ucet\/zabezpeceni$/);
}

export async function deleteAccountFromSettings(options: {
  page: Page;
  password: string;
}): Promise<void> {
  await options.page.goto("/cs/ucet");
  await expect(options.page).toHaveURL(/\/cs\/ucet$/);

  const openDialogButton = options.page.getByRole("button", {
    name: "Trvale smazat účet",
  });

  await expect(openDialogButton).toBeVisible();
  await openDialogButton.click();

  const dialog = options.page.getByRole("alertdialog");

  await expect(dialog.getByRole("heading", { name: "Trvale smazat účet" })).toBeVisible();
  await expect(dialog.locator("#account-delete-password")).toBeVisible();

  await dialog.locator("#account-delete-password").fill(options.password);
  await dialog
    .getByRole("checkbox", {
      name: "Rozumím, že touto akcí bude nevratně smazán účet a s ním spojená veškerá data.",
    })
    .click();
  await dialog.getByRole("button", { name: "Smazat trvale" }).click();
}

export async function changeAccountPassword(options: {
  page: Page;
  currentPassword: string;
  newPassword: string;
  confirmPassword?: string;
}): Promise<void> {
  await openAccountSecurityPage(options.page);
  await options.page.locator("#account-password-currentPassword").fill(options.currentPassword);
  await options.page.locator("#account-password-newPassword").fill(options.newPassword);
  await options.page
    .locator("#account-password-confirmPassword")
    .fill(options.confirmPassword ?? options.newPassword);
  await options.page.getByRole("button", { name: "Aktualizovat heslo" }).click();
}

export async function confirmEmailChange(options: { page: Page; password: string }): Promise<void> {
  await options.page.locator("#confirm-email-change-password").fill(options.password);
  await options.page.getByRole("button", { name: "Potvrdit změnu e-mailu" }).click();
}

export async function signOutCurrentUser(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Můj účet" }).click();
  await page.getByRole("menuitem", { name: "Odhlásit se" }).click();
}
