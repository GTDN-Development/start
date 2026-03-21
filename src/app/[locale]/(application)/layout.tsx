import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { ApplicationLayout } from "@/features/application/application-layout";
import { AUTH_REDIRECTS } from "@/config/auth";
import { getServerAuthSession } from "@/server/auth/auth-service";
import { getActiveWorkspaceSlugCookie } from "@/server/workspaces/workspace-cookie";
import { listUserWorkspaces } from "@/server/workspaces/workspace-general-service";

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
  const authSession = await getServerAuthSession();

  if (!authSession.ok) {
    redirect({
      href: AUTH_REDIRECTS.unauthenticatedTo,
      locale: locale as Locale,
    });

    return null;
  }

  const sessionPayload = authSession.ok ? authSession.data : null;
  const session = sessionPayload?.session;

  if (!session) {
    redirect({
      href: AUTH_REDIRECTS.unauthenticatedTo,
      locale: locale as Locale,
    });

    return null;
  }

  const user = {
    email: session.user.email,
    name: session.user.name,
    verified: session.user.verified,
    avatarUrl: session.user.avatarUrl,
  };
  const userWorkspacesResponse = await listUserWorkspaces(session.user.id);

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
        kind: workspace.kind,
        role: workspace.role,
        avatarUrl: workspace.avatarUrl,
        memberCount: workspace.memberCount,
      }))
    : [];
  const activeWorkspaceSlug = await getActiveWorkspaceSlugCookie();

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
      locale={locale}
      workspaces={workspaces}
      activeWorkspaceSlug={activeWorkspaceSlug}
      labels={{
        userMenu: {
          account: tNavigation("account"),
          accountPage: tNavigation("account"),
          home: tNavigation("home"),
          overview: tNavigation("overview"),
          emailNotVerified: tApplication("emailNotVerified"),
          emailVerified: tApplication("emailVerified"),
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
