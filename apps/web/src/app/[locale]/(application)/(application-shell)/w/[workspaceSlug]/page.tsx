import { Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { getWorkspaceOverviewHref } from "@/config/routes";
import { redirect } from "@/i18n/navigation";
import { requireWorkspaceRouteAccess } from "@/features/workspaces/workspace-route";
import { resolveCurrentUserWorkspaceRouteAccess } from "@/server/workspaces/workspace-resolution-service";

export default async function Page({ params }: PageProps<"/[locale]/w/[workspaceSlug]">) {
  const { locale, workspaceSlug } = await params;
  const currentLocale = locale as Locale;

  setRequestLocale(currentLocale);

  const { workspace } = requireWorkspaceRouteAccess(
    await resolveCurrentUserWorkspaceRouteAccess(workspaceSlug),
    currentLocale
  );

  redirect({
    href: getWorkspaceOverviewHref(workspace.slug),
    locale: currentLocale,
  });
}
