import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeftIcon, ChevronRightIcon } from "lucide-react";
import { BackLink } from "@/components/ui/back-navigation";
import { Link } from "@/components/ui/link";
import { ContactForm } from "@/features/marketing/contact/contact-form";
import { Container } from "@/components/ui/container";
import { Card, CardContent } from "@/components/ui/card";
import { createPublicPageMetadata } from "@/lib/metadata";
import { ContactCopyItem } from "@/features/marketing/contact/contact-copy-item";
import { legal } from "@/config/legal";
import { formatPhoneNumber } from "@/lib/app-utils";

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await props.params;

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.contact.sales",
  });

  return createPublicPageMetadata({
    title: t("infoTitle"),
    description: t("infoDescription"),
    locale: locale as Locale,
    pathname: "/contact/sales",
  });
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  setRequestLocale(locale as Locale);
  const copy = await getSalesPageCopy(locale as Locale);

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
            <div className="flex flex-col gap-4">
              <ContactCopyItem
                toCopy={legal.contact.sales.email}
                className="text-foreground w-fit text-left underline underline-offset-2 transition-colors hover:no-underline"
              >
                {legal.contact.sales.email}
              </ContactCopyItem>
              <ContactCopyItem
                toCopy={legal.contact.sales.phone}
                className="text-foreground w-fit text-left underline underline-offset-2 transition-colors hover:no-underline"
              >
                {formatPhoneNumber(legal.contact.sales.phone)}
              </ContactCopyItem>
            </div>
            <div className="mt-5 flex flex-col gap-2">
              <p className="text-muted-foreground">{copy.supportPromptTitle}</p>
              <Link
                href="/contact/support"
                className="text-foreground inline-flex w-fit items-center gap-1.5 text-base underline underline-offset-2 hover:no-underline"
              >
                {copy.supportPromptCta}
                <ChevronRightIcon aria-hidden="true" className="size-4" />
              </Link>
            </div>
          </div>

          <Card>
            <CardContent className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <h2 className="font-heading text-lg font-semibold tracking-tight">
                  {copy.formTitle}
                </h2>
                <p className="text-muted-foreground text-sm">{copy.formDescription}</p>
              </div>
              <ContactForm />
            </CardContent>
          </Card>
        </div>
      </Container>
    </div>
  );
}

async function getSalesPageCopy(locale: Locale) {
  "use cache";

  const [t, tContact, tCommonNavigation] = await Promise.all([
    getTranslations({
      locale,
      namespace: "pages.contact.sales",
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
    supportPromptTitle: t("supportPrompt.title"),
    supportPromptCta: t("supportPrompt.cta"),
    formTitle: t("formTitle"),
    formDescription: t("formDescription"),
  };
}
