import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  SettingsItem,
  SettingsItemContent,
  SettingsItemContentBody,
  SettingsItemContentHeader,
  SettingsItemDescription,
  SettingsItemTitle,
} from "@/components/ui/settings-item";
import {
  AccountSettingsListAction,
  AccountSettingsListContent,
  AccountSettingsListDescription,
  AccountSettingsList,
  AccountSettingsListItem,
  AccountSettingsListTitle,
} from "../account-settings-list";
import { StaticPlaceholder } from "@/components/ui/static-placeholder";

export function TwoFactorAuthSettingsItem() {
  return (
    <SettingsItem>
      <SettingsItemContent className="flex flex-col gap-6">
        <div className="flex flex-row flex-wrap items-center gap-6 xl:gap-8">
          <SettingsItemContentHeader className="w-full grow basis-72">
            <StaticPlaceholder />
            <SettingsItemTitle>Two-factor Authentication</SettingsItemTitle>
            <SettingsItemDescription>
              Add an additional layer of security by requiring at least two methods of
              authentication to sign in.
            </SettingsItemDescription>
          </SettingsItemContentHeader>

          <div className="shrink-0 basis-auto">
            <Switch />
          </div>
        </div>
        <SettingsItemContentBody>
          <AccountSettingsList>
            <AuthSettingsItem />
          </AccountSettingsList>
        </SettingsItemContentBody>
      </SettingsItemContent>
    </SettingsItem>
  );
}

function AuthSettingsItem({
  className,
  ...props
}: {} & React.ComponentProps<typeof AccountSettingsListItem>) {
  return (
    <AccountSettingsListItem {...props} className={className}>
      <AccountSettingsListContent>
        <AccountSettingsListTitle>One time password</AccountSettingsListTitle>
        <AccountSettingsListDescription>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Sequi, vero?
        </AccountSettingsListDescription>
      </AccountSettingsListContent>

      <AccountSettingsListAction>
        <Button>Enable</Button>
      </AccountSettingsListAction>
    </AccountSettingsListItem>
  );
}
