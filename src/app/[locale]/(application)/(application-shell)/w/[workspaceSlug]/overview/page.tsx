import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Placeholder, PlaceholderTitle } from "@/components/ui/placeholder";
import { ApplicationPageShell } from "@/features/application/application-page-shell";
import { AUTH_REDIRECTS } from "@/config/auth";
import { redirect } from "@/i18n/navigation";
import { createPageMetadata } from "@/lib/metadata";
import { applyServerAuthCookies } from "@/server/auth/auth-cookies";
import { getServerAuthSession } from "@/server/auth/auth-service";
import { resolveWorkspaceForUserBySlug } from "@/server/workspaces/workspace-resolution-service";

export async function generateMetadata(
  props: PageProps<"/[locale]/w/[workspaceSlug]/overview">
): Promise<Metadata> {
  const { locale, workspaceSlug } = await props.params;

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.workspace.overview",
  });

  return createPageMetadata({
    title: t("title"),
    description: t("description"),
    locale: locale as Locale,
    pathname: {
      pathname: "/w/[workspaceSlug]/overview",
      params: {
        workspaceSlug,
      },
    },
  });
}

export default async function Page({ params }: PageProps<"/[locale]/w/[workspaceSlug]/overview">) {
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

  const tNav = await getTranslations({
    locale: locale as Locale,
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
