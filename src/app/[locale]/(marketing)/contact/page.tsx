import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ContactForm } from "@/features/marketing/contact/contact-form";
import { Container } from "@/components/ui/container";
import { Hero, HeroContent, HeroDescription, HeroTitle } from "@/components/ui/hero";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
    locale: locale as Locale,
    pathname: "/contact",
  });
}

export default async function Page({ params }: PageProps<"/[locale]/contact">) {
  const { locale } = await params;

  // Enable static rendering
  setRequestLocale(locale as Locale);

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.contact",
  });

  return (
    <div className="relative">
      <Hero>
        <HeroContent size="md">
          <HeroTitle>{t("title")}</HeroTitle>
          <HeroDescription>{t("description")}</HeroDescription>
        </HeroContent>
      </Hero>

      <Container className="pb-24">
        <div className="grid gap-12 md:grid-cols-2">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <h2 className="text-2xl font-bold tracking-tight">{t("supportTitle")}</h2>
              <p className="text-muted-foreground">{t("supportDescription")}</p>
            </div>
            <div>
              <Button variant="secondary" size="lg">
                {t("supportButton")}
              </Button>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <p className="text-muted-foreground text-sm font-medium">Email</p>
                <a
                  href="mailto:hello@example.com"
                  className="text-foreground hover:text-muted-foreground text-lg transition-colors"
                >
                  hello@example.com
                </a>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-muted-foreground text-sm font-medium">Phone</p>
                <a
                  href="tel:+1234567890"
                  className="text-foreground hover:text-muted-foreground text-lg transition-colors"
                >
                  +1 234 567 890
                </a>
              </div>
            </div>
          </div>

          <Card>
            <CardContent>
              <ContactForm />
            </CardContent>
          </Card>
        </div>
      </Container>
    </div>
  );
}
