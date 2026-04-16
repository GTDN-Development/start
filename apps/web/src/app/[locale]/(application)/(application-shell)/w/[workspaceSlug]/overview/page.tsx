import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/container";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Placeholder, PlaceholderTitle } from "@/components/ui/placeholder";
import { ApplicationPageShell } from "@/features/application/application-page-shell";
import { requireWorkspaceRouteAccess } from "@/features/workspaces/workspace-route";
import { resolveCurrentUserWorkspaceRouteAccess } from "@/server/workspaces/workspace-resolution-service";

export async function generateMetadata(
  props: PageProps<"/[locale]/w/[workspaceSlug]/overview">
): Promise<Metadata> {
  const { locale } = await props.params;

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.workspace.overview",
  });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function Page({ params }: PageProps<"/[locale]/w/[workspaceSlug]/overview">) {
  const { locale, workspaceSlug } = await params;
  const currentLocale = locale as Locale;

  setRequestLocale(currentLocale);

  requireWorkspaceRouteAccess(
    await resolveCurrentUserWorkspaceRouteAccess(workspaceSlug),
    currentLocale
  );

  const tNav = await getTranslations({
    locale: currentLocale,
    namespace: "layout.navigation.items",
  });

  return (
    <ApplicationPageShell
      breadcrumbs={
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>{tNav("overview")}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      }
    >
      <Container size="xl" className="space-y-16 pt-10 pb-24">
        <Placeholder>
          <PlaceholderTitle>Overview Content</PlaceholderTitle>
        </Placeholder>

        <Placeholder>
          <PlaceholderTitle>Overview Content</PlaceholderTitle>
        </Placeholder>

        <Placeholder>
          <PlaceholderTitle>Overview Content</PlaceholderTitle>
        </Placeholder>

        <Placeholder>
          <PlaceholderTitle>Overview Content</PlaceholderTitle>
        </Placeholder>
      </Container>
    </ApplicationPageShell>
  );
}
