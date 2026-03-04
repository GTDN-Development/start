import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { createPageMetadata } from "@/lib/metadata";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { ApplicationPageShell } from "@/features/application/new/application-page-shell";
import {
  ApplicationPageHero,
  ApplicationPageHeroContent,
  ApplicationPageHeroDescription,
  ApplicationPageHeroTitle,
} from "@/features/application/new/application-page-hero";
import { Placeholder, PlaceholderTitle } from "@/components/ui/placeholder";

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

  // Enable static rendering
  setRequestLocale(locale as Locale);

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.overview",
  });
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
      <ApplicationPageHero>
        <ApplicationPageHeroContent size="xl">
          <ApplicationPageHeroTitle>{t("title")}</ApplicationPageHeroTitle>
          <ApplicationPageHeroDescription>{t("description")}</ApplicationPageHeroDescription>
        </ApplicationPageHeroContent>
      </ApplicationPageHero>

      <Container size="xl" className="pb-24">
        {/* Overview content goes here */}
        <Placeholder>
          <PlaceholderTitle>Overview Content</PlaceholderTitle>
        </Placeholder>

        <div className="mt-16">
          <Placeholder>
            <PlaceholderTitle>Overview Content</PlaceholderTitle>
          </Placeholder>
        </div>
      </Container>
    </ApplicationPageShell>
  );
}
