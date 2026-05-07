import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getOrganizationSettingsHref } from "@/config/routes";
import { OrganizationMembersSettingsSection } from "@/features/organizations/settings/members/organization-members-settings-section";
import { SettingsPage } from "@/features/application/settings-page";
import { requireOrganizationRouteAccess } from "@/features/organizations/organization-route";
import { resolveOrganizationRouteAccess } from "@/server/organizations/organization-route-queries";
import {
  listOrganizationInvitesForSettings,
  listOrganizationMembersForSettings,
} from "@/server/organizations/organization-settings-queries";

export async function generateMetadata(
  props: PageProps<"/[locale]/o/[organizationSlug]/settings/members">
): Promise<Metadata> {
  const { locale } = await props.params;

  const tNav = await getTranslations({
    locale: locale as Locale,
    namespace: "layout.navigation.items",
  });

  const tOrganizationNav = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.organization.nav",
  });

  return {
    title: `${tNav("settings")} · ${tOrganizationNav("members")}`,
    description: tOrganizationNav("members"),
  };
}

export default async function Page({
  params,
}: PageProps<"/[locale]/o/[organizationSlug]/settings/members">) {
  const { locale, organizationSlug } = await params;
  const currentLocale = locale as Locale;

  setRequestLocale(currentLocale);

  const { pb, user, organization } = requireOrganizationRouteAccess(
    await resolveOrganizationRouteAccess(organizationSlug),
    currentLocale
  );
  const tOrganizationMembersPage = await getTranslations({
    locale: currentLocale,
    namespace: "pages.organization.members.page",
  });

  const membersResponse = await listOrganizationMembersForSettings(pb, organization.id);

  if (!membersResponse.ok) {
    redirect({
      href: getOrganizationSettingsHref(organization.slug),
      locale: currentLocale,
    });

    return null;
  }

  const invitesResponse =
    organization.role === "member"
      ? {
          ok: true,
          data: {
            invites: [],
          },
        }
      : await listOrganizationInvitesForSettings(pb, organization.id);

  if (!invitesResponse.ok) {
    redirect({
      href: getOrganizationSettingsHref(organization.slug),
      locale: currentLocale,
    });

    return null;
  }

  const members = membersResponse.data.members;
  const invites = invitesResponse.data.invites;

  const ownerCount = members.filter((member) => member.role === "owner").length;
  const currentUserMember = members.find((member) => member.userId === user.id) ?? null;
  const isCurrentUserLastOwner = currentUserMember?.role === "owner" && ownerCount === 1;

  const organizationSettings = {
    id: organization.id,
    slug: organization.slug,
    name: organization.name,
    currentUserId: user.id,
    role: organization.role,
    isCurrentUserLastOwner,
    avatarUrl: organization.avatarUrl,
  } as const;

  return (
    <SettingsPage
      title={tOrganizationMembersPage("title")}
      description={tOrganizationMembersPage("description")}
    >
      {/* Keep members and invites under one client owner to avoid broad refreshes/remounts. */}
      <OrganizationMembersSettingsSection
        key={organizationSettings.id}
        organization={organizationSettings}
        initialMembers={members}
        initialInvites={invites}
      />
    </SettingsPage>
  );
}
