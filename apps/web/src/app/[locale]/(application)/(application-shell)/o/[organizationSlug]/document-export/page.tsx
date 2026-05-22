import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Container } from "@/components/ui/container";
import { Link } from "@/components/ui/link";
import { getOrganizationOverviewHref } from "@/config/routes";
import {
  ApplicationPageHero,
  ApplicationPageHeroContent,
  ApplicationPageHeroDescription,
  ApplicationPageHeroTitle,
} from "@/features/application/application-page-hero";
import { ApplicationPageShell } from "@/features/application/application-page-shell";
import { DocumentExportPanel } from "@/features/document-export/document-export-panel";
import { requireOrganizationRouteAccess } from "@/features/organizations/organization-route";
import { resolveOrganizationRouteAccess } from "@/server/organizations/organization-route-queries";

export async function generateMetadata(
  props: PageProps<"/[locale]/o/[organizationSlug]/document-export">
): Promise<Metadata> {
  const { locale } = await props.params;

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.documentExport",
  });

  return {
    title: t("organization.title"),
    description: t("organization.metadataDescription"),
  };
}

export default async function Page({
  params,
}: PageProps<"/[locale]/o/[organizationSlug]/document-export">) {
  const { locale, organizationSlug } = await params;
  const currentLocale = locale as Locale;

  setRequestLocale(currentLocale);

  const { organization } = requireOrganizationRouteAccess(
    await resolveOrganizationRouteAccess(organizationSlug),
    currentLocale
  );

  const [t, tNav] = await Promise.all([
    getTranslations({
      locale: currentLocale,
      namespace: "pages.documentExport",
    }),
    getTranslations({
      locale: currentLocale,
      namespace: "layout.navigation.items",
    }),
  ]);

  return (
    <ApplicationPageShell
      breadcrumbs={
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                render={<Link href={getOrganizationOverviewHref(organization.slug)} />}
              >
                {tNav("overview")}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{tNav("documentExport")}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      }
    >
      <ApplicationPageHero>
        <ApplicationPageHeroContent size="xl">
          <ApplicationPageHeroTitle>{t("organization.title")}</ApplicationPageHeroTitle>
          <ApplicationPageHeroDescription>
            {t("organization.description", {
              organizationName: organization.name,
            })}
          </ApplicationPageHeroDescription>
        </ApplicationPageHeroContent>
      </ApplicationPageHero>

      <Container size="xl" className="pt-4 pb-24">
        <DocumentExportPanel
          title={t("panel.title")}
          description={t("panel.description")}
          ctaLabel={t("panel.cta")}
          href={`/api/document-export/sample?organizationSlug=${encodeURIComponent(
            organization.slug
          )}&locale=${encodeURIComponent(currentLocale)}`}
        />
      </Container>
    </ApplicationPageShell>
  );
}
