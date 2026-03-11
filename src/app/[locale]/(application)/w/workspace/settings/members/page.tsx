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
import { Link } from "@/components/ui/link";
import {
  mapInnerSidebarItems,
  workspaceSettingsInnerSidebarItems,
} from "@/features/application/inner-sidebar/inner-sidebar-items";
import { InnerSidebarLayout } from "@/features/application/inner-sidebar/inner-sidebar-layout";
import { ApplicationPageShell } from "@/features/application/application-page-shell";
import { SettingsPage } from "@/features/application/settings-page";
import { WorkspaceInviteMembersSettingsItem } from "@/features/workspaces/settings/members/workspace-invite-members-settings-item";
import { WorkspaceMembersManagementSettingsItem } from "@/features/workspaces/settings/members/workspace-members-management-settings-item";
import { createPageMetadata } from "@/lib/metadata";

export async function generateMetadata(
  props: PageProps<"/[locale]/w/workspace/settings/members">
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

  return createPageMetadata({
    title: `${tNav("workspace")} · ${tWorkspaceNav("members")}`,
    description: tWorkspaceNav("members"),
    locale: locale as Locale,
    pathname: "/w/workspace/settings/members",
  });
}

export default async function Page({
  params,
}: PageProps<"/[locale]/w/workspace/settings/members">) {
  const { locale } = await params;

  setRequestLocale(locale as Locale);

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

  const innerSidebarItems = mapInnerSidebarItems(workspaceSettingsInnerSidebarItems, tWorkspaceNav);

  return (
    <ApplicationPageShell
      breadcrumbs={
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/w/workspace/settings" />}>
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
          <SettingsPage title="Members" description="Manage team members and invitations">
            <div className="grid gap-8">
              <WorkspaceInviteMembersSettingsItem />
              <WorkspaceMembersManagementSettingsItem />
            </div>
          </SettingsPage>
        </InnerSidebarLayout>
      </Container>
    </ApplicationPageShell>
  );
}
