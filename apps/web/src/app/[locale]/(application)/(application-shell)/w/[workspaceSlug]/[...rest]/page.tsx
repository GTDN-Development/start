import { Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { requireWorkspaceRouteAccess } from "@/features/workspaces/workspace-route";
import { resolveWorkspaceRouteAccess } from "@/server/workspaces/workspace-route-queries";

export default async function Page({ params }: PageProps<"/[locale]/w/[workspaceSlug]/[...rest]">) {
  const { locale, workspaceSlug } = await params;
  const currentLocale = locale as Locale;

  setRequestLocale(currentLocale);

  requireWorkspaceRouteAccess(await resolveWorkspaceRouteAccess(workspaceSlug), currentLocale);

  notFound();
}
