import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AccountAvatarSettingsItem } from "@/features/account/general/avatar-settings-item";
import { AccountDeleteAccountSettingsItem } from "@/features/account/general/delete-account-settings-item";
import { AccountDisplayNameSettingsItem } from "@/features/account/general/display-name-settings-item";
import { AccountEmailSettingsItem } from "@/features/account/general/email-change-settings-item";
import { SettingsPage } from "@/features/application/settings-page";
import { createPageMetadata } from "@/lib/metadata";

export async function generateMetadata(props: PageProps<"/[locale]/account">): Promise<Metadata> {
  const { locale } = await props.params;

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.account",
  });

  return createPageMetadata({
    title: t("profilePage.title"),
    description: t("profilePage.description"),
    locale: locale as Locale,
    pathname: "/account",
  });
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
