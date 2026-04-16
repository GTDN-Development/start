import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AccountChangePasswordItem } from "@/features/account/security/password-settings-item";
import { YourDevicesSettingsItem } from "@/features/account/security/your-devices-settings-item";
import { SettingsPage } from "@/features/application/settings-page";
import { listCurrentUserDeviceSessions } from "@/server/auth/current-user";

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
  const initialSessions = await listCurrentUserDeviceSessions();

  const tAccount = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.account",
  });

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
