import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AccountChangePasswordItem } from "@/features/account/security/password-settings-item";
import { SettingsPage } from "@/features/application/settings-page";
import { YourDevicesSettingsItem } from "@/features/account/security/your-devices-settings-item";
import { requireCurrentUser } from "@/server/auth/current-user";
import { listDeviceSessions } from "@/server/device-sessions/device-sessions-service";

export async function generateMetadata(
  props: PageProps<"/[locale]/account/security">
): Promise<Metadata> {
  const { locale } = await props.params;

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.account",
  });

  return {
    title: t("securityPage.title"),
    description: t("securityPage.description"),
  };
}

export default async function Page({ params }: PageProps<"/[locale]/account/security">) {
  const { locale } = await params;

  setRequestLocale(locale as Locale);

  const tAccount = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.account",
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
      title={tAccount("securityPage.title")}
      description={tAccount("securityPage.description")}
    >
      <div className="grid gap-8">
        <AccountChangePasswordItem />
        <YourDevicesSettingsItem initialSessions={initialSessions} />
      </div>
    </SettingsPage>
  );
}
