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
import { cn } from "@/lib/utils";

export function TwoFactorAuthSettingsItem() {
  return (
    <AccountItem>
      <AccountItemContent className="flex flex-col gap-6">
        <div className="flex flex-row flex-wrap items-center gap-6 xl:gap-8">
          <AccountItemContentHeader className="w-full grow basis-72">
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
          <ul className="bg-background divide-y rounded-lg border">
            <AuthSettingsItem />
          </ul>
        </AccountItemContentBody>
      </AccountItemContent>
    </AccountItem>
  );
}

function AuthSettingsItem({ ...props }: {} & React.ComponentProps<"li">) {
  return (
    <li className={cn("flex items-center justify-between gap-5 px-4 py-5", props.className)}>
      <div className="mr-auto flex flex-col gap-1">
        <h4 className="text-sm font-semibold">One time password</h4>
        <p className="text-muted-foreground text-sm">
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Sequi, vero?
        </p>
      </div>

      <div>
        <Button>Enable</Button>
      </div>
    </li>
  );
}
