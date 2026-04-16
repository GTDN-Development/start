import { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { AUTH_REDIRECTS } from "@/config/auth";
import { redirect } from "@/i18n/navigation";
import { requireCurrentUser } from "@/server/auth/current-user";
import { getAvatarUrl, getNullableTrimmedString } from "@/server/pocketbase/pocketbase-utils";
import { buildApplicationShellModel } from "./application-composition";
import { ApplicationRoot } from "./application-root";
import { ApplicationWorkspaceRoot } from "./application-workspace-root";

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
  const shellModelResponse = await buildApplicationShellModel({
    pb: currentUser.pb,
    user: currentUser.user,
  });

  if (!shellModelResponse.ok) {
    if (
      shellModelResponse.errorCode === "UNAUTHORIZED" ||
      shellModelResponse.errorCode === "FORBIDDEN"
    ) {
      redirect({
        href: AUTH_REDIRECTS.unauthenticatedTo,
        locale: appLocale,
      });

      return null;
    }

    console.error(
      `[application-root] Failed to build shell model: ${shellModelResponse.errorCode}`
    );
  }
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

  const root = (
    <ApplicationRoot
      user={user}
      applicationEntryHref={
        shellModelResponse.ok
          ? shellModelResponse.data.applicationEntryHref
          : AUTH_REDIRECTS.authenticatedTo
      }
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

  return (
    <ApplicationWorkspaceRoot
      workspaces={
        shellModelResponse.ok ? (shellModelResponse.data.workspaceNavigation?.workspaces ?? []) : []
      }
      activeWorkspaceSlug={
        shellModelResponse.ok
          ? (shellModelResponse.data.workspaceNavigation?.activeWorkspaceSlug ?? null)
          : null
      }
    >
      {root}
    </ApplicationWorkspaceRoot>
  );
}
