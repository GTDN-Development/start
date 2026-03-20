import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeftIcon, ChevronRightIcon } from "lucide-react";
import { Link } from "@/components/ui/link";
import { ContactForm } from "@/features/marketing/contact/contact-form";
import { Container } from "@/components/ui/container";
import { Card, CardContent } from "@/components/ui/card";
import { createPageMetadata } from "@/lib/metadata";
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

  return createPageMetadata({
    title: t("infoTitle"),
    description: t("infoDescription"),
    locale: locale as Locale,
    pathname: "/contact/sales",
  });
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  setRequestLocale(locale as Locale);

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.contact.sales",
  });
  const tContact = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.contact",
  });

  return (
    <div className="relative pt-20">
      <Container size="lg" className="pb-24">
        <div className="grid gap-12 md:grid-cols-2">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <Link
                href="/contact"
                className="text-muted-foreground hover:text-foreground flex w-fit items-center gap-1.5 text-sm transition-colors"
              >
                <ArrowLeftIcon aria-hidden="true" className="size-4" />
                {tContact("backToContact")}
              </Link>
              <h1 className="font-heading mt-2 text-3xl font-bold tracking-tight md:text-4xl">
                {t("infoTitle")}
              </h1>
              <p className="text-muted-foreground">{t("infoDescription")}</p>
            </div>
            <div className="flex flex-col gap-4">
              <ContactCopyItem
                value={legal.contact.sales.email}
                buttonClassName="hover:text-primary"
              />
              <ContactCopyItem
                value={legal.contact.sales.phone}
                displayValue={formatPhoneNumber(legal.contact.sales.phone)}
                buttonClassName="hover:text-primary"
              />
            </div>
            <div className="mt-2 flex flex-col gap-2">
              <p className="text-muted-foreground">{t("supportPrompt.title")}</p>
              <Link
                href="/contact/support"
                className="hover:text-primary inline-flex w-fit items-center gap-1.5 text-base"
              >
                {t("supportPrompt.cta")}
                <ChevronRightIcon aria-hidden="true" className="size-4" />
              </Link>
            </div>
          </div>

          <Card>
            <CardContent className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <h2 className="font-heading text-lg font-semibold tracking-tight">
                  {t("formTitle")}
                </h2>
                <p className="text-muted-foreground text-sm">{t("formDescription")}</p>
              </div>
              <ContactForm />
            </CardContent>
          </Card>
        </div>
      </Container>
    </div>
  );
}
