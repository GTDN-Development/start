import { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { AUTH_REDIRECTS } from "@/config/auth";
import { APP_HOME_PATH, getWorkspaceOverviewHref } from "@/config/routes";
import { redirect } from "@/i18n/navigation";
import { requireCurrentUser } from "@/server/auth/current-user";
import { getAvatarUrl, getNullableTrimmedString } from "@/server/pocketbase/pocketbase-utils";
import {
  listUserWorkspacesWithClient,
  resolveActiveWorkspaceForUserWithClient,
} from "@/server/workspaces/workspace-resolution-service";
import { ApplicationRoot } from "./application-root";

type ApplicationShellBoundaryProps = {
  children: React.ReactNode;
  params: Promise<{
    locale: string;
  }>;
};

export async function ApplicationShellBoundary({
  children,
  params,
}: ApplicationShellBoundaryProps) {
  const { locale } = await params;
  const appLocale = locale as Locale;
  const currentUser = await requireCurrentUser();

  if (!currentUser.ok) {
    redirect({
      href: AUTH_REDIRECTS.unauthenticatedTo,
      locale: appLocale,
    });

    return null;
  }

  const user = {
    id: currentUser.user.id,
    email: currentUser.user.email,
    name: getNullableTrimmedString(currentUser.user.name),
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
        locale: appLocale,
      });

      return null;
    }

    console.error(
      `[application-root] Failed to load workspaces: ${userWorkspacesResponse.errorCode}`
    );
  }

  const workspaces = userWorkspacesResponse.ok
    ? userWorkspacesResponse.data.workspaces.map((workspace) => ({
        id: workspace.id,
        slug: workspace.slug,
        name: workspace.name,
        role: workspace.role,
        avatarUrl: workspace.avatarUrl,
      }))
    : [];
  const activeWorkspaceResponse = await resolveActiveWorkspaceForUserWithClient(
    currentUser.pb,
    currentUser.user.id
  );

  if (!activeWorkspaceResponse.ok) {
    if (
      activeWorkspaceResponse.errorCode === "UNAUTHORIZED" ||
      activeWorkspaceResponse.errorCode === "FORBIDDEN"
    ) {
      redirect({
        href: AUTH_REDIRECTS.unauthenticatedTo,
        locale: appLocale,
      });

      return null;
    }

    console.error(
      `[application-root] Failed to resolve active workspace: ${activeWorkspaceResponse.errorCode}`
    );
  }

  const activeWorkspaceSlug = activeWorkspaceResponse.ok
    ? (activeWorkspaceResponse.data.workspace?.slug ?? null)
    : null;
  const applicationEntryHref = activeWorkspaceSlug
    ? getWorkspaceOverviewHref(activeWorkspaceSlug)
    : APP_HOME_PATH;
  const [tApplication, tHeader, tHeaderMenu, tNavigation] = await Promise.all([
    getTranslations({
      locale: appLocale,
      namespace: "layout.application",
    }),
    getTranslations({
      locale: appLocale,
      namespace: "layout.header",
    }),
    getTranslations({
      locale: appLocale,
      namespace: "layout.header.menu",
    }),
    getTranslations({
      locale: appLocale,
      namespace: "layout.navigation.items",
    }),
  ]);

  return (
    <ApplicationRoot
      user={user}
      workspaces={workspaces}
      activeWorkspaceSlug={activeWorkspaceSlug}
      applicationEntryHref={applicationEntryHref}
      labels={{
        userMenu: {
          account: tNavigation("myAccount"),
          accountPage: tNavigation("myAccount"),
          applicationEntry: tHeader("goToApplication"),
          website: tApplication("goToWebsite"),
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
    </ApplicationRoot>
  );
}
