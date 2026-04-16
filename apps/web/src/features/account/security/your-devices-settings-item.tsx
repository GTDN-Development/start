"use client";

import { startTransition, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { SIGN_IN_PATH } from "@/config/routes";
import { toast } from "sonner";
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
import { Spinner } from "@/components/ui/spinner";
import type { AuthErrorCode } from "@/features/auth/auth-types";
import {
  signOutDeviceAction,
  signOutOtherDevicesAction,
} from "@/features/account/security/account-security-actions";
import { useRouter } from "@/i18n/navigation";
import { runAsyncTransition } from "@/lib/app-utils";
import type { DeviceSessionListItem } from "@/server/device-sessions/device-sessions-types";
import { LaptopIcon, SmartphoneIcon, TabletIcon } from "lucide-react";

type AccountTranslationFn = (key: string, values?: Record<string, string>) => string;

export function YourDevicesSettingsItem({
  initialSessions,
}: {
  initialSessions: DeviceSessionListItem[];
}) {
  const t = useTranslations("pages.account");
  const locale = useLocale();
  const router = useRouter();

  const [deviceSessions, setDeviceSessions] = useState(initialSessions);
  const [pendingDeviceSessionId, setPendingDeviceSessionId] = useState<string | null>(null);
  const [isSignOutOthersDialogOpen, setIsSignOutOthersDialogOpen] = useState(false);
  const [isSignOutOthersPending, setIsSignOutOthersPending] = useState(false);
  const dateTimeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    [locale]
  );
  const hasOtherDeviceSessions = deviceSessions.some((session) => !session.isCurrentDevice);
  const isSignOutOthersDisabled =
    isSignOutOthersPending || pendingDeviceSessionId !== null || !hasOtherDeviceSessions;

  async function handleSignOutOtherDevices(): Promise<void> {
    setIsSignOutOthersPending(true);

    const response = await runAsyncTransition(() => signOutOtherDevicesAction());

    if (response.ok) {
      startTransition(() => {
        setDeviceSessions((previousSessions) =>
          previousSessions.filter((session) => session.isCurrentDevice)
        );
        setIsSignOutOthersDialogOpen(false);
      });
      toast.success(t("security.devices.status.signOutAllSuccess"));
      setIsSignOutOthersPending(false);
      return;
    }

    handleAuthError(response.errorCode, t, router, "security.devices.status.signOutAllError");
    setIsSignOutOthersPending(false);
  }

  async function handleSignOutDevice(deviceSessionId: string): Promise<void> {
    setPendingDeviceSessionId(deviceSessionId);

    const response = await runAsyncTransition(() =>
      signOutDeviceAction({
        deviceSessionId,
      })
    );

    if (response.ok) {
      startTransition(() => {
        setDeviceSessions((previousSessions) =>
          previousSessions.filter((session) => session.id !== deviceSessionId)
        );
      });
      toast.success(t("security.devices.status.signOutSuccess"));
      setPendingDeviceSessionId(null);
      return;
    }

    if (response.errorCode === "NOT_FOUND") {
      startTransition(() => {
        setDeviceSessions((previousSessions) =>
          previousSessions.filter((session) => session.id !== deviceSessionId)
        );
      });
      toast.error(t("security.devices.status.notFound"));
      setPendingDeviceSessionId(null);
      return;
    }

    handleAuthError(response.errorCode, t, router, "security.devices.status.signOutError");
    setPendingDeviceSessionId(null);
  }

  return (
    <SettingsItem>
      <SettingsItemContent className="flex flex-col gap-6">
        <SettingsItemContentHeader>
          <SettingsItemTitle>{t("security.devices.title")}</SettingsItemTitle>
          <SettingsItemDescription>{t("security.devices.description")}</SettingsItemDescription>
        </SettingsItemContentHeader>

        <SettingsItemContentBody>
          <SettingsItemList>
            {deviceSessions.map((session) => (
              <DeviceItem
                key={session.id}
                session={session}
                t={t}
                dateTimeFormatter={dateTimeFormatter}
                isSignOutPending={pendingDeviceSessionId === session.id}
                isActionsDisabled={isSignOutOthersPending}
                onSignOutDevice={handleSignOutDevice}
              />
            ))}

            {deviceSessions.length === 0 && (
              <SettingsItemListItem>
                <SettingsItemListContent>
                  <SettingsItemListDescription>
                    {t("security.devices.empty")}
                  </SettingsItemListDescription>
                </SettingsItemListContent>
              </SettingsItemListItem>
            )}
          </SettingsItemList>
        </SettingsItemContentBody>
      </SettingsItemContent>

      <SettingsItemFooter className="justify-end">
        <SettingsItemDescription>{t("security.devices.footerHint")}</SettingsItemDescription>

        <AlertDialog
          open={isSignOutOthersDialogOpen}
          onOpenChange={(open) => setIsSignOutOthersDialogOpen(open)}
        >
          <AlertDialogTrigger
            nativeButton={true}
            render={
              <Button type="button" size="lg" disabled={isSignOutOthersDisabled}>
                {isSignOutOthersPending && <Spinner />}
                {isSignOutOthersPending
                  ? t("security.devices.actions.signOutAllPending")
                  : t("security.devices.actions.signOutAll")}
              </Button>
            }
          />
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("security.devices.dialog.title")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("security.devices.dialog.description")}
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter>
              <AlertDialogCancel type="button" size="lg" disabled={isSignOutOthersPending}>
                {t("common.cancel")}
              </AlertDialogCancel>
              <AlertDialogAction
                type="button"
                size="lg"
                disabled={isSignOutOthersPending}
                onClick={handleSignOutOtherDevices}
              >
                {isSignOutOthersPending && <Spinner />}
                {isSignOutOthersPending
                  ? t("security.devices.actions.signOutAllPending")
                  : t("security.devices.actions.signOutAllConfirm")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SettingsItemFooter>
    </SettingsItem>
  );
}

function DeviceItem(input: {
  session: DeviceSessionListItem;
  t: AccountTranslationFn;
  dateTimeFormatter: Intl.DateTimeFormat;
  isSignOutPending: boolean;
  isActionsDisabled: boolean;
  onSignOutDevice: (deviceSessionId: string) => Promise<void>;
}) {
  const { session, t, dateTimeFormatter, isSignOutPending, isActionsDisabled, onSignOutDevice } =
    input;

  return (
    <SettingsItemListItem>
      <SettingsItemListMedia>
        <DeviceIcon deviceType={session.deviceType} />
      </SettingsItemListMedia>

      <SettingsItemListContent>
        <div className="flex flex-col-reverse items-center justify-center gap-3 @xs:flex-row @xs:items-start @xs:justify-start">
          <SettingsItemListTitle>{resolveDeviceTitle(session, t)}</SettingsItemListTitle>
          {session.isCurrentDevice && <Badge>{t("security.devices.currentBadge")}</Badge>}
        </div>
        <SettingsItemListDescription>
          {t("security.devices.sessionMeta", {
            lastSeen: formatLastSeenAt(session.lastSeenAt, dateTimeFormatter, t),
          })}
        </SettingsItemListDescription>
      </SettingsItemListContent>

      {!session.isCurrentDevice && (
        <SettingsItemListAction>
          <Button
            type="button"
            variant="secondary"
            disabled={isActionsDisabled || isSignOutPending}
            onClick={() => void onSignOutDevice(session.id)}
          >
            {isSignOutPending && <Spinner />}
            {t("security.devices.actions.signOut")}
          </Button>
        </SettingsItemListAction>
      )}
    </SettingsItemListItem>
  );
}

function DeviceIcon({ deviceType }: Pick<DeviceSessionListItem, "deviceType">) {
  if (deviceType === "tablet") {
    return <TabletIcon aria-hidden="true" />;
  }

  if (deviceType === "phone") {
    return <SmartphoneIcon aria-hidden="true" />;
  }

  return <LaptopIcon aria-hidden="true" />;
}

function resolveDeviceTitle(session: DeviceSessionListItem, t: AccountTranslationFn): string {
  if (session.deviceLabel.trim()) {
    return session.deviceLabel;
  }

  if (session.os && session.browser) {
    return `${session.os} · ${session.browser}`;
  }

  if (session.os) {
    return session.os;
  }

  if (session.browser) {
    return session.browser;
  }

  return t("security.devices.unknownDevice");
}

function formatLastSeenAt(
  dateValue: string,
  formatter: Intl.DateTimeFormat,
  t: AccountTranslationFn
): string {
  const parsedDate = new Date(dateValue);

  if (Number.isNaN(parsedDate.getTime())) {
    return t("security.devices.unknownLastSeen");
  }

  return formatter.format(parsedDate);
}

function handleAuthError(
  errorCode: AuthErrorCode,
  t: AccountTranslationFn,
  router: ReturnType<typeof useRouter>,
  fallbackKey:
    | "security.devices.status.loadError"
    | "security.devices.status.signOutError"
    | "security.devices.status.signOutAllError"
): void {
  if (errorCode === "UNAUTHORIZED") {
    toast.error(t("security.devices.status.unauthorized"));
    router.replace(SIGN_IN_PATH);
    return;
  }

  if (errorCode === "BAD_REQUEST") {
    toast.error(t("security.devices.status.invalidRequest"));
    return;
  }

  toast.error(t(fallbackKey));
}
