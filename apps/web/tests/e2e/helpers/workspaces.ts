import { expect, type Page } from "@playwright/test";
import { getRequiredTestEnv } from "./test-env";

export async function copySessionCookiesToAppOrigin(page: Page): Promise<void> {
  const sessionCookieNames = new Set(["pb_auth", "pb_auth_persist", "app_device_session"]);
  const sessionCookies = (await page.context().cookies()).filter((cookie) =>
    sessionCookieNames.has(cookie.name)
  );

  await page.context().addCookies(
    sessionCookies.map((cookie) => ({
      name: cookie.name,
      value: cookie.value,
      url: getRequiredTestEnv("NEXT_PUBLIC_APP_URL"),
      expires: cookie.expires,
      httpOnly: cookie.httpOnly,
      secure: cookie.secure,
      sameSite: cookie.sameSite,
    }))
  );
}

export async function acceptWorkspaceInvite(options: { page: Page; email: string }): Promise<void> {
  const acceptButton = options.page.getByRole("button", {
    name: new RegExp(`^Pokračovat jako ${escapeRegExp(options.email)}$`),
  });

  await expect(acceptButton).toBeVisible();
  await acceptButton.click();
}

export async function changeWorkspaceMemberRole(options: {
  page: Page;
  memberIdentifier: string;
  nextRoleLabel: string;
}): Promise<void> {
  const memberRow = getWorkspaceMemberRow(options.page, options.memberIdentifier);

  await expect(memberRow).toBeVisible();
  await memberRow.getByRole("button", { name: "Otevřít akce člena" }).click();
  await options.page.getByRole("menuitem", { name: "Změnit roli" }).click();

  const dialog = options.page.getByRole("alertdialog");
  const targetRoleRadio = dialog.getByRole("radio", {
    name: new RegExp(options.nextRoleLabel, "i"),
  });

  await expect(dialog.getByRole("heading", { name: "Změnit roli člena?" })).toBeVisible();
  await expect(targetRoleRadio).toBeVisible();
  await targetRoleRadio.click();
  await expect(targetRoleRadio).toHaveAttribute("aria-checked", "true");
  await dialog.getByRole("button", { name: "Uložit roli" }).click();

  await expect(options.page.getByText("Role byla aktualizována.")).toBeVisible();
  await expect(memberRow).toContainText(options.nextRoleLabel);
}

export async function removeWorkspaceMember(options: {
  page: Page;
  memberIdentifier: string;
}): Promise<void> {
  const memberRow = getWorkspaceMemberRow(options.page, options.memberIdentifier);
  const actionButton = memberRow.getByRole("button", { name: "Otevřít akce člena" });

  await expect(memberRow).toBeVisible();
  await expect(actionButton).toBeVisible();
  await actionButton.focus();
  await options.page.keyboard.press("Enter");
  await options.page.getByRole("menuitem", { name: "Odebrat z workspace" }).click();

  const dialog = options.page.getByRole("alertdialog");

  await expect(dialog.getByRole("heading", { name: "Odebrat člena z workspace?" })).toBeVisible();
  await dialog.getByRole("button", { name: "Odebrat člena" }).click();
}

export async function leaveWorkspaceFromSettings(options: {
  page: Page;
  workspaceSlug: string;
}): Promise<void> {
  await options.page.goto(`/cs/w/${options.workspaceSlug}/nastaveni`);
  await expect(options.page).toHaveURL(new RegExp(`/cs/w/${options.workspaceSlug}/nastaveni$`));

  const dialog = options.page.getByRole("alertdialog");
  const dialogHeading = dialog.getByRole("heading", { name: "Opustit workspace?" });

  await openAlertDialog(options.page, "Opustit workspace", dialogHeading);

  await dialog.locator("#workspace-leave-confirmationUrl").fill(options.workspaceSlug);
  await dialog
    .getByRole("checkbox", {
      name: "Rozumím, že ztratím přístup do tohoto workspace.",
    })
    .click();
  await dialog.getByRole("button", { name: "Opustit workspace" }).click();
}

export async function updateWorkspaceSlug(options: {
  page: Page;
  currentSlug: string;
  nextSlug: string;
}): Promise<void> {
  await options.page.goto(`/cs/w/${options.currentSlug}/nastaveni`);
  await expect(options.page).toHaveURL(new RegExp(`/cs/w/${options.currentSlug}/nastaveni$`));

  const urlField = options.page.locator("#workspace-general-url-url");
  const urlSettingsForm = options.page.locator("form").filter({
    has: urlField,
  });

  await urlField.fill(options.nextSlug);
  await urlSettingsForm.getByRole("button", { name: "Uložit změny" }).click();

  await expect(options.page.getByText("URL workspace byla aktualizována.")).toBeVisible();
  await expect(options.page).toHaveURL(new RegExp(`/cs/w/${options.nextSlug}/nastaveni$`));
}

export async function deleteWorkspaceFromSettings(options: {
  page: Page;
  workspaceSlug: string;
}): Promise<void> {
  await options.page.goto(`/cs/w/${options.workspaceSlug}/nastaveni`);
  await expect(options.page).toHaveURL(new RegExp(`/cs/w/${options.workspaceSlug}/nastaveni$`));

  const dialog = options.page.getByRole("alertdialog");
  const dialogHeading = dialog.getByRole("heading", { name: "Smazat workspace?" });

  await openAlertDialog(options.page, "Smazat workspace", dialogHeading);
  await dialog.locator("#workspace-delete-confirmationUrl").fill(options.workspaceSlug);
  await dialog
    .getByRole("checkbox", {
      name: "Rozumím, že tuto akci nelze vrátit zpět.",
    })
    .click();
  await dialog.getByRole("button", { name: "Smazat workspace" }).click();
}

function getWorkspaceMemberRow(page: Page, memberIdentifier: string) {
  return page.locator("tbody tr").filter({ hasText: memberIdentifier }).first();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function openAlertDialog(
  page: Page,
  buttonName: string,
  dialogHeading: ReturnType<Page["getByRole"]>
) {
  const trigger = page.getByRole("button", { name: buttonName });

  await expect(trigger).toBeVisible();

  for (let attempt = 0; attempt < 3; attempt += 1) {
    await trigger.click();

    try {
      await expect(dialogHeading).toBeVisible({ timeout: 1_000 });
      return;
    } catch (error) {
      if (attempt === 2) {
        throw error;
      }
    }
  }
}
