import type { Metadata } from "next";
import { Locale, useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";
import { ContactForm } from "@/components/(marketing)/contact/contact-form";
import { MarketingPage } from "@/components/layouts/marketing/marketing-page";
import { Container } from "@/components/ui/container";
import { Hero, HeroContent, HeroDescription, HeroTitle } from "@/components/ui/hero";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { createPageMetadata } from "@/lib/metadata";

export async function generateMetadata(props: PageProps<"/[locale]/contact">): Promise<Metadata> {
  const { locale } = await props.params;

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.contact",
  });

  return createPageMetadata({
    title: t("title"),
    description: t("description"),
    pathname: "/contact",
  });
}

export default function Page({ params }: PageProps<"/[locale]/contact">) {
  const { locale } = use(params);

  // Enable static rendering
  setRequestLocale(locale as Locale);

  const t = useTranslations("pages.contact");

  return (
    <MarketingPage>
      <Hero>
        <HeroContent size="md">
          <HeroTitle>{t("title")}</HeroTitle>
          <HeroDescription>{t("description")}</HeroDescription>
        </HeroContent>
      </Hero>

      <Container size="md" className="pb-24">
        <Card>
          <CardHeader>
            <h2 className="text-2xl font-bold">{t("formTitle")}</h2>
          </CardHeader>
          <CardContent>
            <ContactForm />
          </CardContent>
        </Card>
      </Container>
    </MarketingPage>
  );
}
