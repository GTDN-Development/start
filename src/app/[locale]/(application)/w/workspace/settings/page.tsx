import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Container } from "@/components/ui/container";
import {
  mapInnerSidebarItems,
  workspaceSettingsInnerSidebarItems,
} from "@/features/application/inner-sidebar/inner-sidebar-items";
import { InnerSidebarLayout } from "@/features/application/inner-sidebar/inner-sidebar-layout";
import { ApplicationPageShell } from "@/features/application/application-page-shell";
import { SettingsPage } from "@/features/application/settings-page";
import { WorkspaceAvatarSettingsItem } from "@/features/workspaces/settings/general/workspace-avatar-settings-item";
import { WorkspaceDeleteSettingsItem } from "@/features/workspaces/settings/general/workspace-delete-settings-item";
import { WorkspaceLeaveSettingsItem } from "@/features/workspaces/settings/general/workspace-leave-settings-item";
import { WorkspaceNameSettingsItem } from "@/features/workspaces/settings/general/workspace-name-settings-item";
import { WorkspaceUrlSettingsItem } from "@/features/workspaces/settings/general/workspace-url-settings-item";
import { createPageMetadata } from "@/lib/metadata";

export async function generateMetadata(
  props: PageProps<"/[locale]/w/workspace/settings">
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
    title: `${tNav("workspace")} · ${tWorkspaceNav("general")}`,
    description: tWorkspaceNav("general"),
    locale: locale as Locale,
    pathname: "/w/workspace/settings",
  });
}

export default async function Page({ params }: PageProps<"/[locale]/w/workspace/settings">) {
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
              <BreadcrumbPage>{tWorkspace("title")}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      }
    >
      <Container size="xl" className="pt-10 pb-24">
        <InnerSidebarLayout title={tNav("workspace")} items={innerSidebarItems}>
          <SettingsPage title={tWorkspaceNav("general")}>
            <div className="grid gap-8">
              <WorkspaceNameSettingsItem />
              <WorkspaceUrlSettingsItem />
              <WorkspaceAvatarSettingsItem />
              <WorkspaceLeaveSettingsItem />
              <WorkspaceDeleteSettingsItem />
            </div>
          </SettingsPage>
        </InnerSidebarLayout>
      </Container>
    </ApplicationPageShell>
  );
}
