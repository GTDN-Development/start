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
import { APP_HOME_PATH } from "@/config/routes";
import {
  ApplicationPageHero,
  ApplicationPageHeroContent,
  ApplicationPageHeroDescription,
  ApplicationPageHeroTitle,
} from "@/features/application/application-page-hero";
import { ApplicationPageShell } from "@/features/application/application-page-shell";
import { DocumentExportPanel } from "@/features/document-export/document-export-panel";
import { AUTH_REDIRECTS } from "@/config/auth";
import { redirect } from "@/i18n/navigation";
import { requireCurrentUser } from "@/server/auth/auth-session-service";

export async function generateMetadata(
  props: PageProps<"/[locale]/app/document-export">
): Promise<Metadata> {
  const { locale } = await props.params;

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.documentExport",
  });

  return {
    title: t("user.title"),
    description: t("user.description"),
  };
}

export default async function Page({ params }: PageProps<"/[locale]/app/document-export">) {
  const { locale } = await params;
  const currentLocale = locale as Locale;

  setRequestLocale(currentLocale);

  const currentUser = await requireCurrentUser();

  if (!currentUser.ok) {
    redirect({
      href: AUTH_REDIRECTS.unauthenticatedTo,
      locale: currentLocale,
    });

    return null;
  }

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
              <BreadcrumbLink render={<Link href={APP_HOME_PATH} />}>{tNav("home")}</BreadcrumbLink>
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
          <ApplicationPageHeroTitle>{t("user.title")}</ApplicationPageHeroTitle>
          <ApplicationPageHeroDescription>{t("user.description")}</ApplicationPageHeroDescription>
        </ApplicationPageHeroContent>
      </ApplicationPageHero>

      <Container size="xl" className="pt-4 pb-24">
        <DocumentExportPanel
          title={t("panel.title")}
          description={t("panel.description")}
          ctaLabel={t("panel.cta")}
          href={`/api/document-export/sample?locale=${encodeURIComponent(currentLocale)}`}
        />
      </Container>
    </ApplicationPageShell>
  );
}
