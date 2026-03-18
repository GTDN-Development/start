import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Container } from "@/components/ui/container";
import { Link } from "@/components/ui/link";
import { AccountChangePasswordItem } from "@/features/account/security/password-settings-item";
import {
  accountInnerSidebarItems,
  mapInnerSidebarItems,
} from "@/features/application/inner-sidebar/inner-sidebar-items";
import { InnerSidebarLayout } from "@/features/application/inner-sidebar/inner-sidebar-layout";
import { ApplicationPageShell } from "@/features/application/application-page-shell";
import { SettingsPage } from "@/features/application/settings-page";
import { createPageMetadata } from "@/lib/metadata";
import { YourDevicesSettingsItem } from "@/features/account/security/your-devices-settings-item";
import { requireCurrentUser } from "@/server/auth/current-user";
import { listDeviceSessions } from "@/server/device-sessions/device-sessions-service";

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

  const tAccount = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.account",
  });
  const tNav = await getTranslations({
    locale: locale as Locale,
    namespace: "layout.navigation.items",
  });
  const currentUser = await requireCurrentUser();
  const initialSessions = currentUser.ok
    ? await listDeviceSessions({
        pb: currentUser.pb,
        userId: currentUser.user.id,
        currentSessionIdHash: currentUser.currentSessionIdHash,
      })
    : [];

  const innerSidebarItems = mapInnerSidebarItems(accountInnerSidebarItems, tAccount);

  return (
    <ApplicationPageShell
      breadcrumbs={
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/account" />}>{tNav("account")}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{tAccount("nav.security")}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      }
    >
      <Container className="pt-10 pb-24">
        <InnerSidebarLayout title={tNav("account")} items={innerSidebarItems}>
          <SettingsPage
            title={tAccount("securityPage.title")}
            description={tAccount("securityPage.description")}
          >
            <div className="grid gap-8">
              <AccountChangePasswordItem />
              <YourDevicesSettingsItem initialSessions={initialSessions} />
            </div>
          </SettingsPage>
        </InnerSidebarLayout>
      </Container>
    </ApplicationPageShell>
  );
}
