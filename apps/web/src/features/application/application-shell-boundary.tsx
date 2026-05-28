import { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { AUTH_REDIRECTS } from "@/config/auth";
import { redirect } from "@/i18n/navigation";
import { requireCurrentUser } from "@/server/auth/auth-session-service";
import { getAvatarUrl, getNullableTrimmedString } from "@/server/pocketbase/pocketbase-utils";
import { getActiveLayoutBanner } from "@/server/layout-banners/layout-banner-service";
import { buildApplicationShellModel } from "./application-shell-model";
import { ApplicationRoot } from "./application-root";
import { ApplicationOrganizationRoot } from "./application-organization-root";

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
  const [layoutBanner, tApplication, tHeader, tHeaderMenu, tNavigation, tLayoutBanner] =
    await Promise.all([
      getActiveLayoutBanner({
        area: "application",
        locale: appLocale,
      }),
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
      getTranslations({
        locale: appLocale,
        namespace: "layout.banner",
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
      layoutBanner={layoutBanner}
      layoutBannerLabels={{
        dismiss: tLayoutBanner("close"),
      }}
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
    <ApplicationOrganizationRoot
      organizations={
        shellModelResponse.ok
          ? (shellModelResponse.data.organizationNavigation?.organizations ?? [])
          : []
      }
      activeOrganizationSlug={
        shellModelResponse.ok
          ? (shellModelResponse.data.organizationNavigation?.activeOrganizationSlug ?? null)
          : null
      }
    >
      {root}
    </ApplicationOrganizationRoot>
  );
}
