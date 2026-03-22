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
import { createPageMetadata } from "@/lib/metadata";
import { getServerAuthSession } from "@/server/auth/auth-service";
import { resolveWorkspaceForUserBySlug } from "@/server/workspaces/workspace-resolution-service";
import { listWorkspaceMembers } from "@/server/workspaces/workspace-members-service";

export async function generateMetadata(
  props: PageProps<"/[locale]/w/[workspaceSlug]/settings">
): Promise<Metadata> {
  const { locale, workspaceSlug } = await props.params;

  const tNav = await getTranslations({
    locale: locale as Locale,
    namespace: "layout.navigation.items",
  });

  const tWorkspaceNav = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.workspace.nav",
  });

  return createPageMetadata({
    title: `${tNav("workspace")} · ${tWorkspaceNav("general")}`,
    description: tWorkspaceNav("general"),
    locale: locale as Locale,
    pathname: {
      pathname: "/w/[workspaceSlug]/settings",
      params: {
        workspaceSlug,
      },
    },
  });
}

export default async function Page({ params }: PageProps<"/[locale]/w/[workspaceSlug]/settings">) {
  const { locale, workspaceSlug } = await params;

  setRequestLocale(locale as Locale);

  const sessionResponse = await getServerAuthSession();
  const session = sessionResponse.ok ? sessionResponse.data.session : null;

  if (!sessionResponse.ok || !session) {
    redirect({
      href: AUTH_REDIRECTS.unauthenticatedTo,
      locale: locale as Locale,
    });

    return null;
  }

  const workspaceResponse = await resolveWorkspaceForUserBySlug(
    session.user.id,
    workspaceSlug
  );

  if (!workspaceResponse.ok || !workspaceResponse.data.workspace) {
    redirect({
      href: "/overview",
      locale: locale as Locale,
    });

    return null;
  }

  const workspace = workspaceResponse.data.workspace;

  const membersResponse =
    workspace.role === "owner" ? await listWorkspaceMembers(workspace.slug) : null;

  const isCurrentUserLastOwner =
    workspace.role === "owner" &&
    (membersResponse?.ok
      ? membersResponse.data.members.filter((member) => member.role === "owner").length === 1
      : true);

  const workspaceSettings = {
    id: workspace.id,
    slug: workspace.slug,
    name: workspace.name,
    kind: workspace.kind,
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
    <SettingsPage title={tNav("workspace")} description={tWorkspace("description")}>
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
