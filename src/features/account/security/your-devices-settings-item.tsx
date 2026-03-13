import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  SettingsItem,
  SettingsItemContent,
  SettingsItemContentBody,
  SettingsItemContentHeader,
  SettingsItemDescription,
  SettingsItemFooter,
  SettingsItemTitle,
  SettingsItemListAction,
  SettingsItemListContent,
  SettingsItemListDescription,
  SettingsItemListMedia,
  SettingsItemList,
  SettingsItemListItem,
  SettingsItemListTitle,
} from "@/components/ui/settings-item";
import { detectDeviceType } from "@/lib/device-environment";
import { LaptopIcon, SmartphoneIcon, TabletIcon } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { StaticPlaceholder } from "@/components/ui/static-placeholder";

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
    <SettingsItem>
      <SettingsItemContent className="flex flex-col gap-6">
        <SettingsItemContentHeader>
          <StaticPlaceholder />
          <SettingsItemTitle>Your Devices</SettingsItemTitle>
          <SettingsItemDescription>
            Devices where you are currently logged in.
          </SettingsItemDescription>
        </SettingsItemContentHeader>
        <SettingsItemContentBody>
          <SettingsItemList>
            {MOCK_DEVICES.map((device) => (
              <DeviceItem key={device.id} {...device} />
            ))}
          </SettingsItemList>
        </SettingsItemContentBody>
      </SettingsItemContent>
      <SettingsItemFooter className="justify-end">
        <SettingsItemDescription>
          Sign out of all other devices except this one.
        </SettingsItemDescription>

        <AlertDialog>
          <AlertDialogTrigger render={<Button size="lg">Sign out from all devices</Button>} />
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Sign out of all other devices?</AlertDialogTitle>
              <AlertDialogDescription>
                This will end your active sessions on all other browsers and devices. You will
                remain logged in on this current device.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction>Sign out all</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SettingsItemFooter>
    </SettingsItem>
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
  className?: string;
};

function DeviceIcon({ device, userAgent }: Pick<DeviceItemProps, "device" | "userAgent">) {
  const deviceType = detectDeviceType(device, userAgent);

  if (deviceType === "tablet") return <TabletIcon aria-hidden="true" />;
  if (deviceType === "phone") return <SmartphoneIcon aria-hidden="true" />;
  return <LaptopIcon aria-hidden="true" />;
}

function DeviceItem({
  device,
  browser,
  userAgent,
  place,
  lastSeenAt,
  isCurrentDevice,
  className,
}: DeviceItemProps) {
  return (
    <SettingsItemListItem className={className}>
      <SettingsItemListMedia>
        <DeviceIcon device={device} userAgent={userAgent} />
      </SettingsItemListMedia>

      <SettingsItemListContent>
        <div className="flex flex-col-reverse items-center justify-center gap-3 @xs:flex-row @xs:items-start @xs:justify-start">
          <SettingsItemListTitle>
            {device} - {browser}
          </SettingsItemListTitle>
          {isCurrentDevice && <Badge variant={"secondary"}>This device</Badge>}
        </div>
        <SettingsItemListDescription>
          {place} - {lastSeenAt}
        </SettingsItemListDescription>
      </SettingsItemListContent>

      {!isCurrentDevice && (
        <SettingsItemListAction>
          <Button variant="secondary">Sign out</Button>
        </SettingsItemListAction>
      )}
    </SettingsItemListItem>
  );
}
