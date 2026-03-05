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
import { AccountPage } from "@/features/account/account-page";
import { AccountChangePasswordItem } from "@/features/account/password/password-settings-item";
import { ApplicationPageShell } from "@/features/application/new/application-page-shell";
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
        <AccountPage
          title={tAccount("securityPage.title")}
          description={tAccount("securityPage.description")}
        >
          <div className="grid gap-8">
            <AccountChangePasswordItem />
            {/*<p className="text-destructive text-sm">
              Currently static mocks for devices and two-factor authentication
            </p>*/}
            {/*<YourDevicesSettingsItem />*/}
            {/*<TwoFactorAuthSettingsItem />*/}
          </div>
        </AccountPage>
      </Container>
    </ApplicationPageShell>
  );
}
