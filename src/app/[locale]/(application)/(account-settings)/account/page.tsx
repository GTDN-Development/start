import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AccountAvatarSettingsItem } from "@/features/account/profile/avatar-settings-item";
import { AccountDeleteAccountSettingsItem } from "@/features/account/profile/delete-account-settings-item";
import { AccountDisplayNameSettingsItem } from "@/features/account/profile/display-name-settings-item";
import { AccountEmailSettingsItem } from "@/features/account/profile/email-change-settings-item";
import { SettingsPage } from "@/features/application/settings-page";

export async function generateMetadata(props: PageProps<"/[locale]/account">): Promise<Metadata> {
  const { locale } = await props.params;

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.account",
  });

  return {
    title: t("profilePage.title"),
    description: t("profilePage.description"),
  };
}

export default async function Page({ params }: PageProps<"/[locale]/account">) {
  const { locale } = await params;

  setRequestLocale(locale as Locale);

  const tAccount = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.account",
  });

  return (
    <SettingsPage
      title={tAccount("profilePage.title")}
      description={tAccount("profilePage.description")}
    >
      <div className="grid gap-8">
        <AccountAvatarSettingsItem />
        <AccountDisplayNameSettingsItem />
        <AccountEmailSettingsItem />
        <AccountDeleteAccountSettingsItem />
      </div>
    </SettingsPage>
  );
}
