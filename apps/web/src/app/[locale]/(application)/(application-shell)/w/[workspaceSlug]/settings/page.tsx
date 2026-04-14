import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SettingsPage } from "@/features/application/settings-page";
import { WorkspaceAvatarSettingsItem } from "@/features/workspaces/settings/general/workspace-avatar-settings-item";
import { WorkspaceDeleteSettingsItem } from "@/features/workspaces/settings/general/workspace-delete-settings-item";
import { WorkspaceLeaveSettingsItem } from "@/features/workspaces/settings/general/workspace-leave-settings-item";
import { WorkspaceNameSettingsItem } from "@/features/workspaces/settings/general/workspace-name-settings-item";
import { WorkspaceUrlSettingsItem } from "@/features/workspaces/settings/general/workspace-url-settings-item";
import { AUTH_REDIRECTS } from "@/config/auth";
import { redirect } from "@/i18n/navigation";
import { requireCurrentUser } from "@/server/auth/current-user";
import { resolveWorkspaceForUserBySlugWithClient } from "@/server/workspaces/workspace-resolution-service";
import { listWorkspaceMembersWithClient } from "@/server/workspaces/workspace-members-service";
import { requireWorkspaceRouteResult } from "@/features/workspaces/workspace-route";

export async function generateMetadata(
  props: PageProps<"/[locale]/w/[workspaceSlug]/settings">
): Promise<Metadata> {
  const { locale } = await props.params;

  const tNav = await getTranslations({
    locale: locale as Locale,
    namespace: "layout.navigation.items",
  });

  const tWorkspace = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.workspace",
  });

  return {
    title: `${tNav("settings")} · ${tWorkspace("nav.general")}`,
    description: tWorkspace("description"),
  };
}

export default async function Page({ params }: PageProps<"/[locale]/w/[workspaceSlug]/settings">) {
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

  const membersResponse =
    workspace.role === "owner"
      ? await listWorkspaceMembersWithClient(currentUser.pb, workspace.id)
      : null;

  const isCurrentUserLastOwner =
    workspace.role === "owner" &&
    (membersResponse?.ok
      ? membersResponse.data.members.filter((member) => member.role === "owner").length === 1
      : true);

  const workspaceSettings = {
    id: workspace.id,
    slug: workspace.slug,
    name: workspace.name,
    currentUserId: currentUser.user.id,
    role: workspace.role,
    isCurrentUserLastOwner,
    avatarUrl: workspace.avatarUrl,
  } as const;

  const tNav = await getTranslations({
    locale: locale as Locale,
    namespace: "layout.navigation.items",
  });

  const tWorkspace = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.workspace",
  });

  return (
    <SettingsPage title={tNav("settings")} description={tWorkspace("description")}>
      <div className="grid gap-8">
        <WorkspaceNameSettingsItem workspace={workspaceSettings} />
        <WorkspaceUrlSettingsItem workspace={workspaceSettings} />
        <WorkspaceAvatarSettingsItem workspace={workspaceSettings} />
        <WorkspaceLeaveSettingsItem workspace={workspaceSettings} />
        <WorkspaceDeleteSettingsItem workspace={workspaceSettings} />
      </div>
    </SettingsPage>
  );
}
