import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AccountItem,
  AccountItemContent,
  AccountItemContentBody,
  AccountItemContentHeader,
  AccountItemDescription,
  AccountItemTitle,
} from "@/features/account/account-item";
import { cn } from "@/lib/utils";
import { ComputerIcon } from "lucide-react";

export function YourDevicesSettingsItem() {
  return (
    <AccountItem>
      <AccountItemContent className="flex flex-col gap-6">
        <AccountItemContentHeader>
          <AccountItemTitle>Your Devices</AccountItemTitle>
          <AccountItemDescription>Your devices where you&apos;ve logged in.</AccountItemDescription>
        </AccountItemContentHeader>
        <AccountItemContentBody>
          <ul className="bg-background divide-y rounded-lg border">
            <DeviceItem />
            <DeviceItem />
            <DeviceItem />
          </ul>
        </AccountItemContentBody>
      </AccountItemContent>
    </AccountItem>
  );
}

function DeviceItem({ ...props }: {} & React.ComponentProps<"li">) {
  return (
    <li className={cn("flex items-center justify-between gap-5 px-4 py-5", props.className)}>
      <div className="flex items-center justify-center">
        <ComputerIcon aria-hidden="true" className="size-5" />
      </div>

      <div className="mr-auto flex flex-col gap-1">
        <div className="flex gap-3">
          <h4 className="text-sm font-semibold">Mac OS - Safari</h4>
          <Badge variant={"secondary"}>This device</Badge>
        </div>
        <p className="text-muted-foreground text-sm">
          Moravská 854/2, Doubravka, 312 00 Plzeň - 28.2. 21:37
        </p>
      </div>

      <div>
        <Button>Log out</Button>
      </div>
    </li>
  );
}
