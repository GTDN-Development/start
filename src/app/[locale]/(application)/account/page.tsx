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
import { AccountAvatarSettingsItem } from "@/features/account/general/avatar-settings-item";
import { AccountDeleteAccountSettingsItem } from "@/features/account/general/delete-account-settings-item";
import { AccountDisplayNameSettingsItem } from "@/features/account/general/display-name-settings-item";
import { AccountEmailSettingsItem } from "@/features/account/general/email-change-settings-item";
import {
  accountInnerSidebarItems,
  mapInnerSidebarItems,
} from "@/features/application/inner-sidebar/inner-sidebar-items";
import { InnerSidebarLayout } from "@/features/application/inner-sidebar/inner-sidebar-layout";
import { ApplicationPageShell } from "@/features/application/new/application-page-shell";
import { SettingsPage } from "@/features/application/settings-page";
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

  const innerSidebarItems = mapInnerSidebarItems(accountInnerSidebarItems, tAccount);

  return (
    <ApplicationPageShell
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
        <InnerSidebarLayout title={tNav("account")} items={innerSidebarItems}>
          <SettingsPage
            title={tAccount("generalPage.title")}
            description={tAccount("generalPage.description")}
          >
            <div className="grid gap-8">
              <AccountAvatarSettingsItem />
              <AccountDisplayNameSettingsItem />
              <AccountEmailSettingsItem />
              <AccountDeleteAccountSettingsItem />
            </div>
          </SettingsPage>
        </InnerSidebarLayout>
      </Container>
    </ApplicationPageShell>
  );
}
