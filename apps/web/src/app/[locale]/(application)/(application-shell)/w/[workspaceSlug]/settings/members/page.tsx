import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getWorkspaceSettingsHref } from "@/config/routes";
import { WorkspaceMembersSettingsSection } from "@/features/workspaces/settings/members/workspace-members-settings-section";
import { SettingsPage } from "@/features/application/settings-page";
import { requireWorkspaceRouteAccess } from "@/features/workspaces/workspace-route";
import { listWorkspaceInvitesWithClient } from "@/server/workspaces/workspace-invite-service";
import { listWorkspaceMembersWithClient } from "@/server/workspaces/workspace-members-service";
import { resolveCurrentUserWorkspaceRouteAccess } from "@/server/workspaces/workspace-resolution-service";

export async function generateMetadata(
  props: PageProps<"/[locale]/w/[workspaceSlug]/settings/members">
): Promise<Metadata> {
  const { locale } = await props.params;

  const tNav = await getTranslations({
    locale: locale as Locale,
    namespace: "layout.navigation.items",
  });

  const tWorkspaceNav = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.workspace.nav",
  });

  return {
    title: `${tNav("settings")} · ${tWorkspaceNav("members")}`,
    description: tWorkspaceNav("members"),
  };
}

export default async function Page({
  params,
}: PageProps<"/[locale]/w/[workspaceSlug]/settings/members">) {
  const { locale, workspaceSlug } = await params;
  const currentLocale = locale as Locale;

  setRequestLocale(currentLocale);

  const { pb, user, workspace } = requireWorkspaceRouteAccess(
    await resolveCurrentUserWorkspaceRouteAccess(workspaceSlug),
    currentLocale
  );
  const tWorkspaceMembersPage = await getTranslations({
    locale: currentLocale,
    namespace: "pages.workspace.members.page",
  });

  const membersResponse = await listWorkspaceMembersWithClient(pb, workspace.id);

  if (!membersResponse.ok) {
    redirect({
      href: getWorkspaceSettingsHref(workspace.slug),
      locale: currentLocale,
    });

    return null;
  }

  const invitesResponse =
    workspace.role === "member"
      ? {
          ok: true,
          data: {
            invites: [],
          },
        }
      : await listWorkspaceInvitesWithClient(pb, workspace.id);

  if (!invitesResponse.ok) {
    redirect({
      href: getWorkspaceSettingsHref(workspace.slug),
      locale: currentLocale,
    });

    return null;
  }

  const members = membersResponse.data.members;
  const invites = invitesResponse.data.invites;

  const ownerCount = members.filter((member) => member.role === "owner").length;
  const currentUserMember = members.find((member) => member.userId === user.id) ?? null;
  const isCurrentUserLastOwner = currentUserMember?.role === "owner" && ownerCount === 1;

  const workspaceSettings = {
    id: workspace.id,
    slug: workspace.slug,
    name: workspace.name,
    currentUserId: user.id,
    role: workspace.role,
    isCurrentUserLastOwner,
    avatarUrl: workspace.avatarUrl,
  } as const;

  return (
    <SettingsPage
      title={tWorkspaceMembersPage("title")}
      description={tWorkspaceMembersPage("description")}
    >
      {/* Keep members and invites under one client owner to avoid broad refreshes/remounts. */}
      <WorkspaceMembersSettingsSection
        workspace={workspaceSettings}
        initialMembers={members}
        initialInvites={invites}
      />
    </SettingsPage>
  );
}
