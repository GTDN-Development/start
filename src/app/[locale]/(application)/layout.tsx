import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { ApplicationLayout } from "@/features/application/application-layout";
import type { WorkspaceNavigationItem } from "@/features/workspaces/workspace-types";
import { AUTH_REDIRECTS } from "@/config/auth";
import { applyServerAuthCookies } from "@/server/auth/auth-cookies";
import { requireCurrentUser } from "@/server/auth/current-user";
import { getAvatarUrl, getNullableTrimmedString } from "@/server/pocketbase/pocketbase-utils";
import { getActiveWorkspaceSlugCookie } from "@/server/workspaces/workspace-cookie";
import { listUserWorkspacesWithClient } from "@/server/workspaces/workspace-resolution-service";

type ApplicationRouteLayoutProps = {
  children: React.ReactNode;
  params: Promise<{
    locale: string;
  }>;
};

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function Layout({ children, params }: ApplicationRouteLayoutProps) {
  const { locale } = await params;
  const currentUser = await requireCurrentUser();

  await applyServerAuthCookies(currentUser.ok ? undefined : currentUser.setCookie);

  if (!currentUser.ok) {
    redirect({
      href: AUTH_REDIRECTS.unauthenticatedTo,
      locale: locale as Locale,
    });

    return null;
  }

  const user = {
    id: currentUser.user.id,
    email: currentUser.user.email,
    name: getNullableTrimmedString(currentUser.user.name),
    verified: currentUser.user.verified === true,
    avatarUrl: getAvatarUrl(currentUser.pb, currentUser.user),
  };
  const userWorkspacesResponse = await listUserWorkspacesWithClient(
    currentUser.pb,
    currentUser.user.id
  );

  if (!userWorkspacesResponse.ok) {
    if (
      userWorkspacesResponse.errorCode === "UNAUTHORIZED" ||
      userWorkspacesResponse.errorCode === "FORBIDDEN"
    ) {
      redirect({
        href: AUTH_REDIRECTS.unauthenticatedTo,
        locale: locale as Locale,
      });

      return null;
    }

    console.error(
      `[application-layout] Failed to load workspaces: ${userWorkspacesResponse.errorCode}`
    );
  }

  const workspaces = userWorkspacesResponse.ok
    ? userWorkspacesResponse.data.workspaces.map((workspace) => ({
        id: workspace.id,
        slug: workspace.slug,
        name: workspace.name,
        role: workspace.role,
        avatarUrl: workspace.avatarUrl,
        memberCount: workspace.memberCount,
      }))
    : [];
  const activeWorkspaceSlug = await getActiveWorkspaceSlugCookie();
  const repairedActiveWorkspaceSlug = resolveActiveWorkspaceSlug(activeWorkspaceSlug, workspaces);

  const tApplication = await getTranslations({
    locale: locale as Locale,
    namespace: "layout.application",
  });
  const tHeaderMenu = await getTranslations({
    locale: locale as Locale,
    namespace: "layout.header.menu",
  });
  const tNavigation = await getTranslations({
    locale: locale as Locale,
    namespace: "layout.navigation.items",
  });

  return (
    <ApplicationLayout
      user={user}
      workspaces={workspaces}
      activeWorkspaceSlug={repairedActiveWorkspaceSlug}
      labels={{
        userMenu: {
          account: tNavigation("account"),
          accountPage: tNavigation("account"),
          personalHome: tNavigation("home"),
          website: tNavigation("website"),
          signOut: tApplication("signOut"),
        },
        mobileMenu: {
          openAriaLabel: tHeaderMenu("openAriaLabel"),
          title: tHeaderMenu("title"),
          close: tHeaderMenu("close"),
        },
      }}
    >
      {children}
    </ApplicationLayout>
  );
}

function resolveActiveWorkspaceSlug(
  activeWorkspaceSlug: string | null,
  workspaces: WorkspaceNavigationItem[]
): string | null {
  if (workspaces.length === 0) {
    return null;
  }

  if (
    activeWorkspaceSlug &&
    workspaces.some((workspace) => workspace.slug === activeWorkspaceSlug)
  ) {
    return activeWorkspaceSlug;
  }

  return workspaces[0]?.slug ?? null;
}
