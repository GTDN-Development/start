import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { createPageMetadata } from "@/lib/metadata";
import { AUTH_REDIRECTS } from "@/config/auth";
import { getServerAuthSession } from "@/server/auth/auth-service";
import { resolvePostAuthWorkspace } from "@/server/workspaces/workspace-resolution-service";
import { getActiveWorkspaceSlugCookie } from "@/server/workspaces/workspace-cookie";

export async function generateMetadata(props: PageProps<"/[locale]/overview">): Promise<Metadata> {
  const { locale } = await props.params;

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.overview",
  });

  return createPageMetadata({
    title: t("title"),
    description: t("description"),
    locale: locale as Locale,
    pathname: "/overview",
  });
}

export default async function Page({ params }: PageProps<"/[locale]/overview">) {
  const { locale } = await params;

  setRequestLocale(locale as Locale);

  const sessionResponse = await getServerAuthSession();

  if (!sessionResponse.ok || !sessionResponse.data.session) {
    redirect({
      href: AUTH_REDIRECTS.unauthenticatedTo,
      locale: locale as Locale,
    });

    return null;
  }

  const session = sessionResponse.data.session;
  const activeWorkspaceSlug = await getActiveWorkspaceSlugCookie();

  const response = await resolvePostAuthWorkspace({
    userId: session.user.id,
    userEmail: session.user.email,
    userName: session.user.name,
    activeWorkspaceSlugCookie: activeWorkspaceSlug,
  });

  if (!response.ok) {
    redirect({
      href: AUTH_REDIRECTS.unauthenticatedTo,
      locale: locale as Locale,
    });

    return null;
  }

  const targetWorkspaceSlug = response.data.workspaceSlug;

  redirect({
    href: {
      pathname: "/w/[workspaceSlug]/overview",
      params: {
        workspaceSlug: targetWorkspaceSlug,
      },
    },
    locale: locale as Locale,
  });
}
