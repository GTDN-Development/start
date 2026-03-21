import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Container } from "@/components/ui/container";
import { Link, redirect } from "@/i18n/navigation";
import {
  mapWorkspaceInnerSidebarItems,
  workspaceSettingsInnerSidebarItems,
} from "@/features/application/inner-sidebar/inner-sidebar-items";
import { InnerSidebarLayout } from "@/features/application/inner-sidebar/inner-sidebar-layout";
import { ApplicationPageShell } from "@/features/application/application-page-shell";
import { SettingsPage } from "@/features/application/settings-page";
import { WorkspaceInviteMembersSettingsItem } from "@/features/workspaces/settings/members/workspace-invite-members-settings-item";
import { WorkspaceMembersManagementSettingsItem } from "@/features/workspaces/settings/members/workspace-members-management-settings-item";
import { createPageMetadata } from "@/lib/metadata";
import { AUTH_REDIRECTS } from "@/config/auth";
import { getServerAuthSession } from "@/server/auth/auth-service";
import { resolveWorkspaceForUserBySlug } from "@/server/workspaces/workspace-resolution-service";
import { listWorkspaceInvites } from "@/server/workspaces/workspace-invite-service";
import { listWorkspaceMembers } from "@/server/workspaces/workspace-members-service";

export async function generateMetadata(
  props: PageProps<"/[locale]/w/[workspaceSlug]/settings/members">
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
    title: `${tNav("workspace")} · ${tWorkspaceNav("members")}`,
    description: tWorkspaceNav("members"),
    locale: locale as Locale,
    pathname: {
      pathname: "/w/[workspaceSlug]/settings/members",
      params: {
        workspaceSlug,
      },
    },
  });
}

export default async function Page({
  params,
}: PageProps<"/[locale]/w/[workspaceSlug]/settings/members">) {
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

  const workspaceResponse = await resolveWorkspaceForUserBySlug(session.user.id, workspaceSlug);

  if (!workspaceResponse.ok || !workspaceResponse.data.workspace) {
    redirect({
      href: "/overview",
      locale: locale as Locale,
    });

    return null;
  }

  const workspace = workspaceResponse.data.workspace;
  const [membersResponse, invitesResponse] = await Promise.all([
    listWorkspaceMembers(workspace.slug),
    listWorkspaceInvites(workspace.slug),
  ]);

  if (!membersResponse.ok || !invitesResponse.ok) {
    redirect({
      href: {
        pathname: "/w/[workspaceSlug]/settings",
        params: {
          workspaceSlug: workspace.slug,
        },
      },
      locale: locale as Locale,
    });

    return null;
  }

  const members = membersResponse.data.members;
  const invites = invitesResponse.data.invites;
  const ownerCount = members.filter((member) => member.role === "owner").length;
  const currentUserMember = members.find((member) => member.userId === session.user.id) ?? null;
  const isCurrentUserLastOwner = currentUserMember?.role === "owner" && ownerCount === 1;
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
  const tWorkspaceNav = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.workspace.nav",
  });
  const tWorkspaceMembersPage = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.workspace.members.page",
  });

  const innerSidebarItems = mapWorkspaceInnerSidebarItems(
    workspaceSettingsInnerSidebarItems,
    workspaceSettings.slug,
    tWorkspaceNav
  );

  return (
    <ApplicationPageShell
      breadcrumbs={
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                render={
                  <Link
                    href={{
                      pathname: "/w/[workspaceSlug]/settings",
                      params: {
                        workspaceSlug: workspaceSettings.slug,
                      },
                    }}
                  />
                }
              >
                {tWorkspace("title")}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{tWorkspaceNav("members")}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      }
    >
      <Container size="xl" className="pt-10 pb-24">
        <InnerSidebarLayout title={tNav("workspace")} items={innerSidebarItems}>
          <SettingsPage
            title={tWorkspaceMembersPage("title")}
            description={tWorkspaceMembersPage("description")}
          >
            <div className="grid gap-8">
              <WorkspaceInviteMembersSettingsItem workspace={workspaceSettings} />
              <WorkspaceMembersManagementSettingsItem
                workspace={workspaceSettings}
                members={members}
                invites={invites}
              />
            </div>
          </SettingsPage>
        </InnerSidebarLayout>
      </Container>
    </ApplicationPageShell>
  );
}
