import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AccountItem,
  AccountItemContent,
  AccountItemContentBody,
  AccountItemContentHeader,
  AccountItemDescription,
  AccountItemFooter,
  AccountItemTitle,
} from "@/features/account/account-item";
import { cn } from "@/lib/utils";
import { detectDeviceType } from "@/lib/platform";
import { LaptopIcon, SmartphoneIcon, TabletIcon } from "lucide-react";

const MOCK_DEVICES: DeviceItemProps[] = [
  {
    id: "mock-1",
    user: "user-1",
    sessionKey: "sk-1",
    device: "Mac OS",
    browser: "Safari",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    ip: "89.24.110.42",
    place: "Moravská 854/2, Doubravka, 312 00 Plzeň",
    lastSeenAt: "2025-02-28T21:37:00Z",
    revokedAt: "",
    created: "2025-01-15T10:00:00Z",
    updated: "2025-02-28T21:37:00Z",
    isCurrentDevice: true,
  },
  {
    id: "mock-2",
    user: "user-1",
    sessionKey: "sk-2",
    device: "Windows",
    browser: "Chrome",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    ip: "185.52.68.11",
    place: "Národní 135/14, Staré Město, 110 00 Praha",
    lastSeenAt: "2025-02-27T14:12:00Z",
    revokedAt: "",
    created: "2025-02-01T08:30:00Z",
    updated: "2025-02-27T14:12:00Z",
  },
  {
    id: "mock-3",
    user: "user-1",
    sessionKey: "sk-3",
    device: "iPhone",
    browser: "Safari",
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)",
    ip: "77.48.220.95",
    place: "Masarykovo nám. 1, 602 00 Brno",
    lastSeenAt: "2025-02-25T09:45:00Z",
    revokedAt: "",
    created: "2025-02-10T12:00:00Z",
    updated: "2025-02-25T09:45:00Z",
  },
  {
    id: "mock-4",
    user: "user-1",
    sessionKey: "sk-4",
    device: "iPad",
    browser: "Safari",
    userAgent: "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)",
    ip: "94.113.45.20",
    place: "Sokolovská 100/94, Karlín, 186 00 Praha",
    lastSeenAt: "2025-02-24T16:20:00Z",
    revokedAt: "",
    created: "2025-02-05T11:15:00Z",
    updated: "2025-02-24T16:20:00Z",
  },
  {
    id: "mock-5",
    user: "user-1",
    sessionKey: "sk-5",
    device: "Android",
    browser: "Chrome",
    userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 8)",
    ip: "31.30.18.77",
    place: "Česká 166/12, Brno-střed, 602 00 Brno",
    lastSeenAt: "2025-02-20T08:55:00Z",
    revokedAt: "",
    created: "2025-02-18T07:30:00Z",
    updated: "2025-02-20T08:55:00Z",
  },
];

export function YourDevicesSettingsItem() {
  return (
    <AccountItem>
      <AccountItemContent className="flex flex-col gap-6">
        <AccountItemContentHeader>
          <AccountItemTitle>Your Devices</AccountItemTitle>
          <AccountItemDescription>
            Devices where you are currently logged in.
          </AccountItemDescription>
        </AccountItemContentHeader>
        <AccountItemContentBody>
          <ul className="bg-background divide-y rounded-lg border">
            {MOCK_DEVICES.map((device) => (
              <DeviceItem key={device.id} {...device} />
            ))}
          </ul>
        </AccountItemContentBody>
      </AccountItemContent>
      <AccountItemFooter className="justify-end">
        <AccountItemDescription>
          Lorem ipsum dolor sit amet consectetur adipisicing elit.
        </AccountItemDescription>
        <Button size="lg">Log out from all devices</Button>
      </AccountItemFooter>
    </AccountItem>
  );
}

type DeviceItemProps = {
  id: string;
  user: string;
  sessionKey: string;
  device: string;
  browser: string;
  userAgent: string;
  ip: string;
  place: string;
  lastSeenAt: string;
  revokedAt: string;
  created: string;
  updated: string;
  isCurrentDevice?: boolean;
};

function DeviceIcon({ device, userAgent }: Pick<DeviceItemProps, "device" | "userAgent">) {
  const deviceType = detectDeviceType(device, userAgent);

  if (deviceType === "tablet") return <TabletIcon aria-hidden="true" className="size-5" />;
  if (deviceType === "phone") return <SmartphoneIcon aria-hidden="true" className="size-5" />;
  return <LaptopIcon aria-hidden="true" className="size-5" />;
}

function DeviceItem({
  device,
  browser,
  userAgent,
  place,
  lastSeenAt,
  isCurrentDevice,
  ...props
}: DeviceItemProps & React.ComponentProps<"li">) {
  return (
    <li className={cn("flex items-center justify-between gap-5 px-4 py-5", props.className)}>
      <div className="flex items-center justify-center">
        <DeviceIcon device={device} userAgent={userAgent} />
      </div>

      <div className="mr-auto flex flex-col gap-1">
        <div className="flex gap-3">
          <h4 className="text-sm font-semibold">
            {device} - {browser}
          </h4>
          {isCurrentDevice && <Badge variant={"secondary"}>This device</Badge>}
        </div>
        <p className="text-muted-foreground text-sm">
          {place} - {lastSeenAt}
        </p>
      </div>

      <div>
        <Button variant={isCurrentDevice ? "destructive" : "secondary"}>Log out</Button>
      </div>
    </li>
  );
}
