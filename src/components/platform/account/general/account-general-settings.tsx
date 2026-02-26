"use client";

import { AccountAvatarSettingsItem } from "@/components/platform/account/general/account-avatar-settings-item";
import { AccountDeleteAccountSettingsItem } from "@/components/platform/account/general/account-delete-account-settings-item";
import { AccountDisplayNameSettingsItem } from "@/components/platform/account/general/account-display-name-settings-item";
import { AccountEmailSettingsItem } from "@/components/platform/account/general/account-email-settings-item";

export function AccountGeneralSettings() {
  return (
    <div className="grid gap-8">
      <AccountAvatarSettingsItem />
      <AccountDisplayNameSettingsItem />
      <AccountEmailSettingsItem />
      <AccountDeleteAccountSettingsItem />
    </div>
  );
}
