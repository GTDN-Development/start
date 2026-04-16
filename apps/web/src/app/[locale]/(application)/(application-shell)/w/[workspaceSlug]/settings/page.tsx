import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SettingsPage } from "@/features/application/settings-page";
import { WorkspaceGeneralSettingsSection } from "@/features/workspaces/settings/general/workspace-general-settings-section";
import { requireWorkspaceRouteAccess } from "@/features/workspaces/workspace-route";
import { listWorkspaceMembersWithClient } from "@/server/workspaces/workspace-members-service";
import { resolveCurrentUserWorkspaceRouteAccess } from "@/server/workspaces/workspace-resolution-service";

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
  const currentLocale = locale as Locale;

  setRequestLocale(currentLocale);

  const { pb, user, workspace } = requireWorkspaceRouteAccess(
    await resolveCurrentUserWorkspaceRouteAccess(workspaceSlug),
    currentLocale
  );

  const membersResponse =
    workspace.role === "owner" ? await listWorkspaceMembersWithClient(pb, workspace.id) : null;

  const isCurrentUserLastOwner =
    workspace.role === "owner" &&
    (membersResponse?.ok
      ? membersResponse.data.members.filter((member) => member.role === "owner").length === 1
      : true);

  const workspaceSettings = {
    id: workspace.id,
    slug: workspace.slug,
    name: workspace.name,
    currentUserId: user.id,
    role: workspace.role,
    isCurrentUserLastOwner,
    avatarUrl: workspace.avatarUrl,
  } as const;

  const tNav = await getTranslations({
    locale: currentLocale,
    namespace: "layout.navigation.items",
  });

  const tWorkspace = await getTranslations({
    locale: currentLocale,
    namespace: "pages.workspace",
  });

  return (
    <SettingsPage title={tNav("settings")} description={tWorkspace("description")}>
      <WorkspaceGeneralSettingsSection initialWorkspace={workspaceSettings} />
    </SettingsPage>
  );
}
