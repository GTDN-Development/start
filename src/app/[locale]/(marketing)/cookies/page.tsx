import type { Metadata } from "next";
import { Locale, useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";
import { CookiePolicy } from "@/components/(marketing)/legal/cookie-policy";
import { Container } from "@/components/ui/container";
import { Hero, HeroContent, HeroDescription, HeroTitle } from "@/components/ui/hero";
import { legal } from "@/config/legal";
import { cookies } from "@/config/cookies";
import { site } from "@/config/site";

export async function generateMetadata(props: PageProps<"/[locale]/cookies">): Promise<Metadata> {
  const { locale } = await props.params;

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.cookies",
  });

  return {
    metadataBase: new URL(site.url),
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: "/cookies",
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: `${site.url}/cookies`,
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

export default function Page({ params }: PageProps<"/[locale]/cookies">) {
  const { locale } = use(params);

  // Enable static rendering
  setRequestLocale(locale as Locale);

  const t = useTranslations("pages.cookies");

  return (
    <>
      <Hero>
        <HeroContent size="md">
          <HeroTitle>{t("title")}</HeroTitle>
          <HeroDescription>{t("description")}</HeroDescription>
        </HeroContent>
      </Hero>

      <Container size="md" className="prose pb-24">
        <CookiePolicy
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
          cookies={cookies}
          effectiveDate={t("effectiveDate")}
        />
      </Container>
    </>
  );
}
