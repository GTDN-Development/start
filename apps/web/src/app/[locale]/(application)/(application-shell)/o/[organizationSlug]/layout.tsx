import type { Locale } from "next-intl";
import { redirectIfOrganizationsDisabled } from "@/features/organizations/organization-route";

export default async function Layout({
  children,
  params,
}: LayoutProps<"/[locale]/o/[organizationSlug]">) {
  const { locale } = await params;

  redirectIfOrganizationsDisabled(locale as Locale);

  return children;
}
