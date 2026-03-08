import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  AccountItem,
  AccountItemContent,
  AccountItemContentBody,
  AccountItemContentHeader,
  AccountItemDescription,
  AccountItemTitle,
} from "@/features/account/account-item";
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
    <AccountItem>
      <AccountItemContent className="flex flex-col gap-6">
        <div className="flex flex-row flex-wrap items-center gap-6 xl:gap-8">
          <AccountItemContentHeader className="w-full grow basis-72">
            <StaticPlaceholder />
            <AccountItemTitle>Two-factor Authentication</AccountItemTitle>
            <AccountItemDescription>
              Add an additional layer of security by requiring at least two methods of
              authentication to sign in.
            </AccountItemDescription>
          </AccountItemContentHeader>

          <div className="shrink-0 basis-auto">
            <Switch />
          </div>
        </div>
        <AccountItemContentBody>
          <AccountSettingsList>
            <AuthSettingsItem />
          </AccountSettingsList>
        </AccountItemContentBody>
      </AccountItemContent>
    </AccountItem>
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
