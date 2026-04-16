import { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { workspaceSettingsInnerSidebarItems } from "@/features/workspaces/settings/workspace-settings-inner-sidebar-items";
import { mapWorkspaceInnerSidebarItems } from "@/features/application/inner-sidebar/inner-sidebar-items";
import { InnerSidebarBreadcrumbs } from "@/features/application/inner-sidebar/inner-sidebar-breadcrumbs";
import { InnerSidebarLayout } from "@/features/application/inner-sidebar/inner-sidebar-layout";
import { ApplicationPageShell } from "@/features/application/application-page-shell";
import { getWorkspaceSettingsHref } from "@/config/routes";
import { requireWorkspaceRouteAccess } from "@/features/workspaces/workspace-route";
import { resolveCurrentUserWorkspaceRouteAccess } from "@/server/workspaces/workspace-resolution-service";

export default async function Layout({
  children,
  params,
}: LayoutProps<"/[locale]/w/[workspaceSlug]/settings">) {
  const { locale, workspaceSlug } = await params;
  const currentLocale = locale as Locale;
  const { workspace } = requireWorkspaceRouteAccess(
    await resolveCurrentUserWorkspaceRouteAccess(workspaceSlug),
    currentLocale
  );
  const tNav = await getTranslations({
    locale: currentLocale,
    namespace: "layout.navigation.items",
  });
  const tWorkspaceNav = await getTranslations({
    locale: currentLocale,
    namespace: "pages.workspace.nav",
  });

  const innerSidebarItems = mapWorkspaceInnerSidebarItems(
    workspaceSettingsInnerSidebarItems,
    workspace.slug,
    tWorkspaceNav
  );

  return (
    <ApplicationPageShell
      breadcrumbs={
        <InnerSidebarBreadcrumbs
          items={innerSidebarItems}
          rootHref={getWorkspaceSettingsHref(workspace.slug)}
          rootLabel={tNav("settings")}
        />
      }
    >
      <Container size="xl" className="pt-10 pb-24">
        <InnerSidebarLayout title={tNav("settings")} items={innerSidebarItems}>
          {children}
        </InnerSidebarLayout>
      </Container>
    </ApplicationPageShell>
  );
}
