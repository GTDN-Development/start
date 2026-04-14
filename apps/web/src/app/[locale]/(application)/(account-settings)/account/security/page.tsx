import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AccountChangePasswordItem } from "@/features/account/security/password-settings-item";
import { AccountSecurityDevicesSection } from "@/features/account/security/account-security-devices-section";
import { SettingsPage } from "@/features/application/settings-page";

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

  return (
    <SettingsPage
      title={tAccount("securityPage.title")}
      description={tAccount("securityPage.description")}
    >
      <div className="grid gap-8">
        <AccountChangePasswordItem />
        <AccountSecurityDevicesSection />
      </div>
    </SettingsPage>
  );
}
