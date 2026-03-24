import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AccountLanguageSettingsItem } from "@/features/account/preferences/account-language-settings-item";
import { AccountThemeSettingsItem } from "@/features/account/preferences/account-theme-settings-item";
import { SettingsPage } from "@/features/application/settings-page";
import { createPageMetadata } from "@/lib/metadata";

export async function generateMetadata(
  props: PageProps<"/[locale]/account/preferences">
): Promise<Metadata> {
  const { locale } = await props.params;

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.account",
  });

  return createPageMetadata({
    title: t("generalPage.title"),
    description: t("generalPage.description"),
    locale: locale as Locale,
    pathname: "/account/preferences",
  });
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
      title={tAccount("generalPage.title")}
      description={tAccount("generalPage.description")}
    >
      <div className="grid gap-8">
        <AccountLanguageSettingsItem />
        <AccountThemeSettingsItem />
      </div>
    </SettingsPage>
  );
}
