import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Container } from "@/components/ui/container";
import { AccountPage } from "@/features/account/account-page";
import { AccountAvatarSettingsItem } from "@/features/account/avatar/avatar-settings-item";
import { AccountDeleteAccountSettingsItem } from "@/features/account/delete-account/delete-account-settings-item";
import { AccountDisplayNameSettingsItem } from "@/features/account/profile/profile-settings-item";
import { AccountEmailSettingsItem } from "@/features/account/email-change/email-change-settings-item";
import { ApplicationPageShell } from "@/features/application/new/application-page-shell";
import { createPageMetadata } from "@/lib/metadata";

export async function generateMetadata(props: PageProps<"/[locale]/account">): Promise<Metadata> {
  const { locale } = await props.params;

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.account",
  });

  return createPageMetadata({
    title: t("generalPage.title"),
    description: t("generalPage.description"),
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
  const tNav = await getTranslations({
    locale: locale as Locale,
    namespace: "layout.navigation.items",
  });

  return (
    <ApplicationPageShell
      title={tAccount("title")}
      breadcrumbs={
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>{tNav("account")}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      }
    >
      <Container className="pt-10 pb-24">
        <AccountPage
          title={tAccount("generalPage.title")}
          description={tAccount("generalPage.description")}
        >
          <div className="grid gap-8">
            <AccountAvatarSettingsItem />
            <AccountDisplayNameSettingsItem />
            <AccountEmailSettingsItem />
            <AccountDeleteAccountSettingsItem />
          </div>
        </AccountPage>
      </Container>
    </ApplicationPageShell>
  );
}
