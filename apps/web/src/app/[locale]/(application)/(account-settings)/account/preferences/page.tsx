import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AccountCookieSettingsItem } from "@/features/account/preferences/account-cookie-settings-item";
import { AccountLanguageSettingsItem } from "@/features/account/preferences/account-language-settings-item";
import { AccountThemeSettingsItem } from "@/features/account/preferences/account-theme-settings-item";
import { SettingsPage } from "@/features/application/settings-page";

export async function generateMetadata(
  props: PageProps<"/[locale]/account/preferences">
): Promise<Metadata> {
  const { locale } = await props.params;

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.account",
  });

  return {
    title: t("preferencesPage.title"),
    description: t("preferencesPage.description"),
  };
}

export default async function Page({ params }: PageProps<"/[locale]/account/preferences">) {
  const { locale } = await params;

  setRequestLocale(locale as Locale);

  const tAccount = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.account",
  });

  return (
    <SettingsPage
      title={tAccount("preferencesPage.title")}
      description={tAccount("preferencesPage.description")}
    >
      <div className="grid gap-8">
        <AccountLanguageSettingsItem />
        <AccountThemeSettingsItem />
        <AccountCookieSettingsItem />
      </div>
    </SettingsPage>
  );
}
