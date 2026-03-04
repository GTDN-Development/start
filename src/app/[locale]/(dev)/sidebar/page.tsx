import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { createPageMetadata } from "@/lib/metadata";
import { Placeholder, PlaceholderTitle } from "@/components/ui/placeholder";
import {
  ApplicationPageHero,
  ApplicationPageHeroContent,
  ApplicationPageHeroDescription,
  ApplicationPageHeroTitle,
} from "@/features/application/new/application-page-hero";
import { ApplicationPageShell } from "@/features/application/new/application-page-shell";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Link } from "@/components/ui/link";

export async function generateMetadata(props: PageProps<"/[locale]/sidebar">): Promise<Metadata> {
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

export default async function Page({ params }: PageProps<"/[locale]/sidebar">) {
  const { locale } = await params;

  // Enable static rendering
  setRequestLocale(locale as Locale);

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.overview",
  });

  return (
    <ApplicationPageShell
      breadcrumbs={
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/" />}>Demo Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/" />}>Demo Breadcrumb</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Demo Breadcrumb</BreadcrumbPage>
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

      <Container size="xl" className="space-y-16 pb-24">
        {/* Overview content goes here */}
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
