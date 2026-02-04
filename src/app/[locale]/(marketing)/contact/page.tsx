import type { Metadata } from "next";
import { Locale, useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";
import { ContactForm } from "@/components/(marketing)/contact/contact-form";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Hero, HeroActions, HeroContent, HeroDescription, HeroTitle } from "@/components/ui/hero";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { contact, formatPhoneNumber } from "@/config/contact";
import { site } from "@/config/site";

export async function generateMetadata(props: PageProps<"/[locale]/contact">): Promise<Metadata> {
  const { locale } = await props.params;

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "ContactPage",
  });

  return {
    metadataBase: new URL(site.url),
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: "/contact",
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: `${site.url}/contact`,
    },
    twitter: {
      title: t("title"),
      description: t("description"),
    },
  };
}

export default function Page({ params }: PageProps<"/[locale]/contact">) {
  const { locale } = use(params);

  // Enable static rendering
  setRequestLocale(locale as Locale);

  const t = useTranslations("ContactPage");

  return (
    <div>
      <Hero>
        <HeroContent size="md">
          <HeroTitle>{t("title")}</HeroTitle>
          <HeroDescription>{t("description")}</HeroDescription>
          <HeroActions>
            <Button size="lg" asChild>
              <a href={`mailto:${contact.email}`}>{contact.email}</a>
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <a href={`tel:${contact.phone}`}>{formatPhoneNumber(contact.phone)}</a>
            </Button>
          </HeroActions>
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
    </div>
  );
}
