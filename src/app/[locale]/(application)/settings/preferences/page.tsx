import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SettingsLanguageSettingsItem } from "@/features/settings/preferences/settings-language-settings-item";
import { SettingsThemeSettingsItem } from "@/features/settings/preferences/settings-theme-settings-item";
import { SettingsPage } from "@/features/application/settings-page";
import { createPageMetadata } from "@/lib/metadata";

export async function generateMetadata(
  props: PageProps<"/[locale]/settings/preferences">
): Promise<Metadata> {
  const { locale } = await props.params;

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.settings",
  });

  return createPageMetadata({
    title: t("preferencesPage.title"),
    description: t("preferencesPage.description"),
    locale: locale as Locale,
    pathname: "/settings/preferences",
  });
}

export default async function Page({ params }: PageProps<"/[locale]/settings/preferences">) {
  const { locale } = await params;

  setRequestLocale(locale as Locale);

  const tSettings = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.settings",
  });

  return (
    <SettingsPage
      title={tSettings("preferencesPage.title")}
      description={tSettings("preferencesPage.description")}
    >
      <div className="grid gap-8">
        <SettingsLanguageSettingsItem />
        <SettingsThemeSettingsItem />
      </div>
    </SettingsPage>
  );
}
