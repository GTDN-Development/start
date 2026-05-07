import { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { organizationSettingsInnerSidebarItems } from "@/features/organizations/settings/organization-settings-inner-sidebar-items";
import { mapOrganizationInnerSidebarItems } from "@/features/application/inner-sidebar/inner-sidebar-items";
import { InnerSidebarBreadcrumbs } from "@/features/application/inner-sidebar/inner-sidebar-breadcrumbs";
import { InnerSidebarLayout } from "@/features/application/inner-sidebar/inner-sidebar-layout";
import { ApplicationPageShell } from "@/features/application/application-page-shell";
import { getOrganizationSettingsHref } from "@/config/routes";
import { requireOrganizationRouteAccess } from "@/features/organizations/organization-route";
import { resolveOrganizationRouteAccess } from "@/server/organizations/organization-route-queries";

export default async function Layout({
  children,
  params,
}: LayoutProps<"/[locale]/o/[organizationSlug]/settings">) {
  const { locale, organizationSlug } = await params;
  const currentLocale = locale as Locale;
  const { organization } = requireOrganizationRouteAccess(
    await resolveOrganizationRouteAccess(organizationSlug),
    currentLocale
  );
  const tNav = await getTranslations({
    locale: currentLocale,
    namespace: "layout.navigation.items",
  });
  const tOrganizationNav = await getTranslations({
    locale: currentLocale,
    namespace: "pages.organization.nav",
  });

  const innerSidebarItems = mapOrganizationInnerSidebarItems(
    organizationSettingsInnerSidebarItems,
    organization.slug,
    tOrganizationNav
  );

  return (
    <ApplicationPageShell
      breadcrumbs={
        <InnerSidebarBreadcrumbs
          items={innerSidebarItems}
          rootHref={getOrganizationSettingsHref(organization.slug)}
          rootLabel={tNav("settings")}
        />
      }
    >
      <Container size="xl" className="pt-10 pb-24">
        <InnerSidebarLayout title={tNav("settings")} items={innerSidebarItems}>
          {children}
        </InnerSidebarLayout>
      </Container>
    </ApplicationPageShell>
  );
}
