import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SettingsChangePasswordItem } from "@/features/settings/security/password-settings-item";
import { SettingsPage } from "@/features/application/settings-page";
import { createPageMetadata } from "@/lib/metadata";
import { YourDevicesSettingsItem } from "@/features/settings/security/your-devices-settings-item";
import { requireCurrentUser } from "@/server/auth/current-user";
import { listDeviceSessions } from "@/server/device-sessions/device-sessions-service";

export async function generateMetadata(
  props: PageProps<"/[locale]/settings/security">
): Promise<Metadata> {
  const { locale } = await props.params;

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.settings",
  });

  return createPageMetadata({
    title: t("securityPage.title"),
    description: t("securityPage.description"),
    locale: locale as Locale,
    pathname: "/settings/security",
  });
}

export default async function Page({ params }: PageProps<"/[locale]/settings/security">) {
  const { locale } = await params;

  setRequestLocale(locale as Locale);

  const tSettings = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.settings",
  });

  const currentUser = await requireCurrentUser();

  const initialSessions = currentUser.ok
    ? await listDeviceSessions({
        pb: currentUser.pb,
        userId: currentUser.user.id,
        currentSessionIdHash: currentUser.currentSessionIdHash,
      })
    : [];

  return (
    <SettingsPage
      title={tSettings("securityPage.title")}
      description={tSettings("securityPage.description")}
    >
      <div className="grid gap-8">
        <SettingsChangePasswordItem />
        <YourDevicesSettingsItem initialSessions={initialSessions} />
      </div>
    </SettingsPage>
  );
}
