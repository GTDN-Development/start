import { Suspense } from "react";
import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeftIcon } from "lucide-react";
import { BackLink } from "@/components/ui/back-navigation";
import { Container } from "@/components/ui/container";
import { Card, CardContent } from "@/components/ui/card";
import { createPublicPageMetadata } from "@/lib/metadata";
import { ContactCopyItem } from "@/features/marketing/contact/contact-copy-item";
import { legal } from "@/config/legal";
import { SupportFormCardSkeleton } from "@/features/marketing/contact/support-form-card-skeleton";
import { SupportFormGate } from "@/features/marketing/contact/support-form-gate";

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await props.params;

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.contact.support",
  });

  return createPublicPageMetadata({
    title: t("infoTitle"),
    description: t("infoDescription"),
    locale: locale as Locale,
    pathname: "/contact/support",
  });
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  setRequestLocale(locale as Locale);
  const copy = await getSupportPageCopy(locale as Locale);

  return (
    <div className="relative pt-20">
      <Container size="lg" className="pb-24">
        <div className="grid gap-12 md:grid-cols-2">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <BackLink
                fallbackHref="/contact"
                className="text-muted-foreground hover:text-foreground flex w-fit items-center gap-1.5 text-sm transition-colors"
                backContent={
                  <>
                    <ArrowLeftIcon aria-hidden="true" className="size-4" />
                    {copy.back}
                  </>
                }
              >
                <ArrowLeftIcon aria-hidden="true" className="size-4" />
                {copy.backToContact}
              </BackLink>
              <h1 className="font-heading mt-2 text-3xl font-bold tracking-tight md:text-4xl">
                {copy.infoTitle}
              </h1>
              <p className="text-muted-foreground">{copy.infoDescription}</p>
            </div>
            <ContactCopyItem
              toCopy={legal.contact.support.email}
              className="text-foreground w-fit text-left underline underline-offset-2 transition-colors hover:no-underline"
            >
              {legal.contact.support.email}
            </ContactCopyItem>
          </div>

          <Card>
            <CardContent className="flex flex-1 flex-col justify-center">
              <Suspense fallback={<SupportFormCardSkeleton />}>
                <SupportFormGate locale={locale as Locale} />
              </Suspense>
            </CardContent>
          </Card>
        </div>
      </Container>
    </div>
  );
}

async function getSupportPageCopy(locale: Locale) {
  "use cache";

  const [t, tContact, tCommonNavigation] = await Promise.all([
    getTranslations({
      locale,
      namespace: "pages.contact.support",
    }),
    getTranslations({
      locale,
      namespace: "pages.contact",
    }),
    getTranslations({
      locale,
      namespace: "common.navigation",
    }),
  ]);

  return {
    back: tCommonNavigation("back"),
    backToContact: tContact("backToContact"),
    infoTitle: t("infoTitle"),
    infoDescription: t("infoDescription"),
  };
}
