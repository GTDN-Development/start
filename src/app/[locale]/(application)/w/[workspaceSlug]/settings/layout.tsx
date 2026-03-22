import { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";
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
import { getServerAuthSession } from "@/server/auth/auth-service";
import { resolveWorkspaceForUserBySlug } from "@/server/workspaces/workspace-resolution-service";

export default async function Layout({
  children,
  params,
}: LayoutProps<"/[locale]/w/[workspaceSlug]/settings">) {
  const { locale, workspaceSlug } = await params;
  const currentLocale = locale as Locale;
  const sessionResponse = await getServerAuthSession();
  const session = sessionResponse.ok ? sessionResponse.data.session : null;

  if (!sessionResponse.ok || !session) {
    redirect({
      href: AUTH_REDIRECTS.unauthenticatedTo,
      locale: currentLocale,
    });

    return null;
  }

  const workspaceResponse = await resolveWorkspaceForUserBySlug(session.user.id, workspaceSlug);

  if (!workspaceResponse.ok || !workspaceResponse.data.workspace) {
    redirect({
      href: "/overview",
      locale: currentLocale,
    });

    return null;
  }

  const workspace = workspaceResponse.data.workspace;
  const tNav = await getTranslations({
    locale: currentLocale,
    namespace: "layout.navigation.items",
  });
  const tWorkspace = await getTranslations({
    locale: currentLocale,
    namespace: "pages.workspace",
  });
  const tWorkspaceNav = await getTranslations({
    locale: currentLocale,
    namespace: "pages.workspace.nav",
  });

  const innerSidebarItems = mapWorkspaceInnerSidebarItems(
    getWorkspaceSettingsInnerSidebarItems(workspace.kind),
    workspace.slug,
    tWorkspaceNav
  );

  return (
    <ApplicationPageShell
      breadcrumbs={
        <InnerSidebarBreadcrumbs
          items={innerSidebarItems}
          rootHref={{
            pathname: "/w/[workspaceSlug]/settings",
            params: {
              workspaceSlug: workspace.slug,
            },
          }}
          rootLabel={tWorkspace("title")}
        />
      }
    >
      <Container size="xl" className="pt-10 pb-24">
        <InnerSidebarLayout title={tNav("workspace")} items={innerSidebarItems}>
          {children}
        </InnerSidebarLayout>
      </Container>
    </ApplicationPageShell>
  );
}
