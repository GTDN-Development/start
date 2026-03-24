import { Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { AUTH_REDIRECTS } from "@/config/auth";
import { getWorkspaceOverviewHref } from "@/config/routes";
import { redirect } from "@/i18n/navigation";
import { applyServerAuthCookies } from "@/server/auth/auth-cookies";
import { getServerAuthSession } from "@/server/auth/auth-service";
import { resolveWorkspaceForUserBySlug } from "@/server/workspaces/workspace-resolution-service";

export default async function Page({ params }: PageProps<"/[locale]/w/[workspaceSlug]">) {
  const { locale, workspaceSlug } = await params;

  setRequestLocale(locale as Locale);

  const sessionResponse = await getServerAuthSession();

  await applyServerAuthCookies(sessionResponse.setCookie);

  const session = sessionResponse.ok ? sessionResponse.data.session : null;

  if (!sessionResponse.ok || !session) {
    redirect({
      href: AUTH_REDIRECTS.unauthenticatedTo,
      locale: locale as Locale,
    });

    return null;
  }

  const workspaceResponse = await resolveWorkspaceForUserBySlug(session.user.id, workspaceSlug);

  if (!workspaceResponse.ok || !workspaceResponse.data.workspace) {
    notFound();
  }

  redirect({
    href: getWorkspaceOverviewHref(workspaceResponse.data.workspace.slug),
    locale: locale as Locale,
  });
}
