import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ContactForm } from "@/features/marketing/contact/contact-form";
import { Container } from "@/components/ui/container";
// import { Hero, HeroContent, HeroDescription, HeroTitle } from "@/components/ui/hero";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createPageMetadata } from "@/lib/metadata";
import { ContactCopyItem } from "@/features/marketing/contact/contact-copy-item";

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await props.params;

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.contact.sales",
  });

  return createPageMetadata({
    title: t("title"),
    description: t("infoDescription"),
    locale: locale as Locale,
    pathname: "/contact/sales",
  });
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  // Enable static rendering
  setRequestLocale(locale as Locale);

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.contact.sales",
  });

  return (
    <div className="relative pt-20">
      {/*<Hero>
        <HeroContent size="md">
          <HeroTitle>{t("title")}</HeroTitle>
          <HeroDescription>{t("infoDescription")}</HeroDescription>
        </HeroContent>
      </Hero>*/}

      <Container className="pb-24">
        <div className="grid gap-12 md:grid-cols-2">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <h2 className="text-2xl font-bold tracking-tight">{t("infoTitle")}</h2>
              <p className="text-muted-foreground">{t("infoDescription")}</p>
            </div>
            <div>
              <Button variant="secondary" size="lg">
                {t("infoButton")}
              </Button>
            </div>
            <div className="flex flex-col gap-4">
              <ContactCopyItem label="Email" value={t("email")} />
              <ContactCopyItem label="Phone" value={t("phone")} />
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
