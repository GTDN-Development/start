import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { createPageMetadata } from "@/lib/metadata";
import { AUTH_REDIRECTS } from "@/features/auth/auth-routes";
import { getServerAuthSession } from "@/server/auth/auth-service";
import {
  consumePendingInviteIfPresent,
  ensurePersonalWorkspace,
  pickWorkspaceForOverview,
} from "@/server/workspaces/workspace-service";
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

  const personalWorkspaceResponse = await ensurePersonalWorkspace(
    session.user.id,
    session.user.email,
    session.user.name
  );

  if (!personalWorkspaceResponse.ok) {
    redirect({
      href: AUTH_REDIRECTS.unauthenticatedTo,
      locale: locale as Locale,
    });

    return null;
  }

  const pendingInviteResponse = await consumePendingInviteIfPresent({
    id: session.user.id,
    email: session.user.email,
  });

  const activeWorkspaceSlug = await getActiveWorkspaceSlugCookie();
  const pickWorkspaceResponse = await pickWorkspaceForOverview(session.user.id, activeWorkspaceSlug);

  if (!pickWorkspaceResponse.ok || !pickWorkspaceResponse.data.workspace) {
    redirect({
      href: AUTH_REDIRECTS.unauthenticatedTo,
      locale: locale as Locale,
    });

    return null;
  }

  let targetWorkspaceSlug = pickWorkspaceResponse.data.workspace.slug;

  if (
    pendingInviteResponse.ok &&
    (pendingInviteResponse.data.result.state === "accepted" ||
      pendingInviteResponse.data.result.state === "already_member")
  ) {
    targetWorkspaceSlug = pendingInviteResponse.data.result.workspace.slug;
  }

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
