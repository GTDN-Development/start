import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SettingsAvatarSettingsItem } from "@/features/settings/profile/avatar-settings-item";
import { SettingsDeleteAccountSettingsItem } from "@/features/settings/profile/delete-account-settings-item";
import { SettingsDisplayNameSettingsItem } from "@/features/settings/profile/display-name-settings-item";
import { SettingsEmailSettingsItem } from "@/features/settings/profile/email-change-settings-item";
import { SettingsPage } from "@/features/application/settings-page";
import { createPageMetadata } from "@/lib/metadata";

export async function generateMetadata(
  props: PageProps<"/[locale]/settings/profile">
): Promise<Metadata> {
  const { locale } = await props.params;

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.settings",
  });

  return createPageMetadata({
    title: t("profilePage.title"),
    description: t("profilePage.description"),
    locale: locale as Locale,
    pathname: "/settings/profile",
  });
}

export default async function Page({ params }: PageProps<"/[locale]/settings/profile">) {
  const { locale } = await params;

  setRequestLocale(locale as Locale);

  const tSettings = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.settings",
  });

  return (
    <SettingsPage
      title={tSettings("profilePage.title")}
      description={tSettings("profilePage.description")}
    >
      <div className="grid gap-8">
        <SettingsAvatarSettingsItem />
        <SettingsDisplayNameSettingsItem />
        <SettingsEmailSettingsItem />
        <SettingsDeleteAccountSettingsItem />
      </div>
    </SettingsPage>
  );
}
