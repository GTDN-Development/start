import { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import {
  getWorkspaceSettingsInnerSidebarItems,
  mapWorkspaceInnerSidebarItems,
} from "@/features/application/inner-sidebar/inner-sidebar-items";
import { InnerSidebarBreadcrumbs } from "@/features/application/inner-sidebar/inner-sidebar-breadcrumbs";
import { InnerSidebarLayout } from "@/features/application/inner-sidebar/inner-sidebar-layout";
import { ApplicationPageShell } from "@/features/application/application-page-shell";
import { AUTH_REDIRECTS } from "@/config/auth";
import { redirect } from "@/i18n/navigation";
import { requireCurrentUser } from "@/server/auth/current-user";
import { resolveWorkspaceForUserBySlugWithClient } from "@/server/workspaces/workspace-resolution-service";

export default async function Layout({
  children,
  params,
}: LayoutProps<"/[locale]/w/[workspaceSlug]/settings">) {
  const { locale, workspaceSlug } = await params;
  const currentLocale = locale as Locale;
  const currentUser = await requireCurrentUser();

  if (!currentUser.ok) {
    redirect({
      href: AUTH_REDIRECTS.unauthenticatedTo,
      locale: currentLocale,
    });

    return null;
  }

  const workspaceResponse = await resolveWorkspaceForUserBySlugWithClient(
    currentUser.pb,
    currentUser.user.id,
    workspaceSlug
  );

  if (!workspaceResponse.ok || !workspaceResponse.data.workspace) {
    notFound();
  }

  const workspace = workspaceResponse.data.workspace;
  const tNav = await getTranslations({
    locale: currentLocale,
    namespace: "layout.navigation.items",
  });
  const tWorkspaceNav = await getTranslations({
    locale: currentLocale,
    namespace: "pages.workspace.nav",
  });

  const innerSidebarItems = mapWorkspaceInnerSidebarItems(
    getWorkspaceSettingsInnerSidebarItems(),
    workspace.slug,
    tWorkspaceNav
  );

  return (
    <ApplicationPageShell
      breadcrumbs={
        <InnerSidebarBreadcrumbs
          items={innerSidebarItems}
          scopeHref={{
            pathname: "/w/[workspaceSlug]/overview",
            params: {
              workspaceSlug: workspace.slug,
            },
          }}
          scopeLabel={workspace.name}
          rootHref={{
            pathname: "/w/[workspaceSlug]/settings",
            params: {
              workspaceSlug: workspace.slug,
            },
          }}
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
