import type { Metadata } from "next";
import { Locale, useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";
import { MarketingPage } from "@/components/layouts/marketing/marketing-page";
import { Container } from "@/components/ui/container";
import {
  Hero,
  HeroBackground,
  HeroContent,
  HeroDescription,
  HeroTitle,
} from "@/components/ui/hero";
import { PatternGrid } from "@/components/ui/patterns";
import { site } from "@/config/site";

export async function generateMetadata(props: PageProps<"/[locale]/pricing">): Promise<Metadata> {
  const { locale } = await props.params;

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.pricing",
  });

  return {
    metadataBase: new URL(site.url),
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: "/pricing",
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: `${site.url}/pricing`,
    },
    twitter: {
      title: t("title"),
      description: t("description"),
    },
  };
}

export default function Page({ params }: PageProps<"/[locale]/pricing">) {
  const { locale } = use(params);

  // Enable static rendering
  setRequestLocale(locale as Locale);

  const t = useTranslations("pages.pricing");

  return (
    <MarketingPage>
      <div>
        <Hero>
          <HeroBackground>
            <PatternGrid className="absolute inset-0 -z-10 size-full opacity-55" />
          </HeroBackground>
          <HeroContent size="md">
            <HeroTitle>{t("title")}</HeroTitle>
            <HeroDescription>{t("description")}</HeroDescription>
          </HeroContent>
        </Hero>

        <Container size="md" className="pb-24">
          <section className="border-border bg-card/60 rounded-2xl border border-dashed p-8 text-center">
            <h2 className="text-xl font-semibold tracking-tight">{t("contentTitle")}</h2>
            <p className="text-muted-foreground mt-3 text-sm text-pretty sm:text-base">
              {t("contentDescription")}
            </p>
          </section>
        </Container>
      </div>
    </MarketingPage>
  );
}
