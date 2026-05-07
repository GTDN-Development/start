import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SettingsPage } from "@/features/application/settings-page";
import { OrganizationGeneralSettingsSection } from "@/features/organizations/settings/general/organization-general-settings-section";
import { requireOrganizationRouteAccess } from "@/features/organizations/organization-route";
import { resolveOrganizationRouteAccess } from "@/server/organizations/organization-route-queries";
import { listOrganizationMembersForSettings } from "@/server/organizations/organization-settings-queries";

export async function generateMetadata(
  props: PageProps<"/[locale]/o/[organizationSlug]/settings">
): Promise<Metadata> {
  const { locale } = await props.params;

  const tNav = await getTranslations({
    locale: locale as Locale,
    namespace: "layout.navigation.items",
  });

  const tOrganization = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.organization",
  });

  return {
    title: `${tNav("settings")} · ${tOrganization("nav.general")}`,
    description: tOrganization("description"),
  };
}

export default async function Page({
  params,
}: PageProps<"/[locale]/o/[organizationSlug]/settings">) {
  const { locale, organizationSlug } = await params;
  const currentLocale = locale as Locale;

  setRequestLocale(currentLocale);

  const { pb, user, organization } = requireOrganizationRouteAccess(
    await resolveOrganizationRouteAccess(organizationSlug),
    currentLocale
  );

  const membersResponse =
    organization.role === "owner"
      ? await listOrganizationMembersForSettings(pb, organization.id)
      : null;

  const isCurrentUserLastOwner =
    organization.role === "owner" &&
    (membersResponse?.ok
      ? membersResponse.data.members.filter((member) => member.role === "owner").length === 1
      : true);

  const organizationSettings = {
    id: organization.id,
    slug: organization.slug,
    name: organization.name,
    currentUserId: user.id,
    role: organization.role,
    isCurrentUserLastOwner,
    avatarUrl: organization.avatarUrl,
  } as const;

  const tNav = await getTranslations({
    locale: currentLocale,
    namespace: "layout.navigation.items",
  });

  const tOrganization = await getTranslations({
    locale: currentLocale,
    namespace: "pages.organization",
  });

  return (
    <SettingsPage title={tNav("settings")} description={tOrganization("description")}>
      <OrganizationGeneralSettingsSection initialOrganization={organizationSettings} />
    </SettingsPage>
  );
}
