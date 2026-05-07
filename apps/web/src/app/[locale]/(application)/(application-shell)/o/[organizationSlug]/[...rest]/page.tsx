import { Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { requireOrganizationRouteAccess } from "@/features/organizations/organization-route";
import { resolveOrganizationRouteAccess } from "@/server/organizations/organization-route-queries";

export default async function Page({
  params,
}: PageProps<"/[locale]/o/[organizationSlug]/[...rest]">) {
  const { locale, organizationSlug } = await params;
  const currentLocale = locale as Locale;

  setRequestLocale(currentLocale);

  requireOrganizationRouteAccess(
    await resolveOrganizationRouteAccess(organizationSlug),
    currentLocale
  );

  notFound();
}
