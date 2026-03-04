import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AccountPage } from "@/features/account/account-page";
import { AccountChangePasswordItem } from "@/features/account/password/password-settings-item";
import { createPageMetadata } from "@/lib/metadata";
// import { YourDevicesSettingsItem } from "@/features/account/your-devices/your-devices-settings-item";
// import { TwoFactorAuthSettingsItem } from "@/features/account/two-factor-auth/two-factor-auth-settings-item";

export async function generateMetadata(
  props: PageProps<"/[locale]/account/security">
): Promise<Metadata> {
  const { locale } = await props.params;

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.account",
  });

  return createPageMetadata({
    title: t("securityPage.title"),
    description: t("securityPage.description"),
    locale: locale as Locale,
    pathname: "/account/security",
  });
}

export default async function Page({ params }: PageProps<"/[locale]/account/security">) {
  const { locale } = await params;

  setRequestLocale(locale as Locale);

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.account",
  });

  return (
    <AccountPage title={t("securityPage.title")} description={t("securityPage.description")}>
      <div className="grid gap-8">
        <AccountChangePasswordItem />
        {/*<p className="text-destructive text-sm">
          Currently static mocks for devices and two-factor authentication
        </p>*/}
        {/*<YourDevicesSettingsItem />*/}
        {/*<TwoFactorAuthSettingsItem />*/}
      </div>
    </AccountPage>
  );
}
