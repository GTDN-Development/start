import type { Metadata } from "next";
import { Locale, useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";
import { GdprPolicy } from "@/components/(marketing)/legal/gdpr-policy";
import { Container } from "@/components/ui/container";
import { Hero, HeroContent, HeroDescription, HeroTitle } from "@/components/ui/hero";
import { legal } from "@/config/legal";
import { site } from "@/config/site";

export async function generateMetadata(props: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await props.params;

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "GdprPage",
  });

  return {
    metadataBase: new URL(site.url),
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: "/gdpr",
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: `${site.url}/gdpr`,
    },
    twitter: {
      title: t("title"),
      description: t("description"),
    },
    robots: {
      index: false,
      follow: true,
    },
  };
}

export default function Page({ params }: PageProps<"/[locale]">) {
  const { locale } = use(params);

  // Enable static rendering
  setRequestLocale(locale as Locale);

  const t = useTranslations("GdprPage");

  return (
    <>
      <Hero>
        <HeroContent size="md">
          <HeroTitle>{t("title")}</HeroTitle>
          <HeroDescription>{t("description")}</HeroDescription>
        </HeroContent>
      </Hero>

      <Container size="md" className="prose pb-24">
        <GdprPolicy
          company={{
            name: legal.legalName,
            address: legal.address,
            id: legal.id,
            domain: legal.domain,
          }}
          contact={{
            email: legal.contact.email,
            phone: legal.contact.phone,
          }}
          effectiveDate="1. January 2025"
          locale={locale === "cs" ? "cs" : "en"}
        />
      </Container>
    </>
  );
}
