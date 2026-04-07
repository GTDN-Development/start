import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getWorkspaceSettingsHref } from "@/config/routes";
import { WorkspaceMembersSettingsSection } from "@/features/workspaces/settings/members/workspace-members-settings-section";
import { SettingsPage } from "@/features/application/settings-page";
import { AUTH_REDIRECTS } from "@/config/auth";
import { requireCurrentUser } from "@/server/auth/current-user";
import { resolveWorkspaceForUserBySlugWithClient } from "@/server/workspaces/workspace-resolution-service";
import { listWorkspaceInvites } from "@/server/workspaces/workspace-invite-service";
import { listWorkspaceMembers } from "@/server/workspaces/workspace-members-service";
import { requireWorkspaceRouteResult } from "@/features/workspaces/workspace-route";

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

  setRequestLocale(locale as Locale);

  const currentUser = await requireCurrentUser();

  if (!currentUser.ok) {
    redirect({
      href: AUTH_REDIRECTS.unauthenticatedTo,
      locale: locale as Locale,
    });

    return null;
  }

  const workspaceResponse = await resolveWorkspaceForUserBySlugWithClient(
    currentUser.pb,
    currentUser.user.id,
    workspaceSlug
  );
  const workspace = requireWorkspaceRouteResult(workspaceResponse);
  const tWorkspaceMembersPage = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.workspace.members.page",
  });

  const membersResponse = await listWorkspaceMembers(workspace.slug);

  if (!membersResponse.ok) {
    redirect({
      href: getWorkspaceSettingsHref(workspace.slug),
      locale: locale as Locale,
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
      : await listWorkspaceInvites(workspace.slug);

  if (!invitesResponse.ok) {
    redirect({
      href: getWorkspaceSettingsHref(workspace.slug),
      locale: locale as Locale,
    });

    return null;
  }

  const members = membersResponse.data.members;
  const invites = invitesResponse.data.invites;

  const ownerCount = members.filter((member) => member.role === "owner").length;
  const currentUserMember = members.find((member) => member.userId === currentUser.user.id) ?? null;
  const isCurrentUserLastOwner = currentUserMember?.role === "owner" && ownerCount === 1;

  const workspaceSettings = {
    id: workspace.id,
    slug: workspace.slug,
    name: workspace.name,
    currentUserId: currentUser.user.id,
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
