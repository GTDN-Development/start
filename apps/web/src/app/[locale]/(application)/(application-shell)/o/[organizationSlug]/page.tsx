import { Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { getOrganizationOverviewHref } from "@/config/routes";
import { redirect } from "@/i18n/navigation";
import { requireOrganizationRouteAccess } from "@/features/organizations/organization-route";
import { resolveOrganizationRouteAccess } from "@/server/organizations/organization-route-queries";

export default async function Page({ params }: PageProps<"/[locale]/o/[organizationSlug]">) {
  const { locale, organizationSlug } = await params;
  const currentLocale = locale as Locale;

  setRequestLocale(currentLocale);

  const { organization } = requireOrganizationRouteAccess(
    await resolveOrganizationRouteAccess(organizationSlug),
    currentLocale
  );

  redirect({
    href: getOrganizationOverviewHref(organization.slug),
    locale: currentLocale,
  });
}
