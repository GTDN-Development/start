import type { Metadata } from "next";
import { Locale, useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";
import { GdprPolicy } from "@/features/marketing/legal/gdpr-policy";
import { Container } from "@/components/ui/container";
import { legal } from "@/config/legal";
import { createPageMetadata } from "@/lib/metadata";

export async function generateMetadata(props: PageProps<"/[locale]/gdpr">): Promise<Metadata> {
  const { locale } = await props.params;

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.gdpr",
  });

  return createPageMetadata({
    title: t("title"),
    description: t("description"),
    locale: locale as Locale,
    pathname: "/gdpr",
    robots: {
      index: false,
      follow: true,
    },
  });
}

export default function Page({ params }: PageProps<"/[locale]/gdpr">) {
  const { locale } = use(params);

  // Enable static rendering
  setRequestLocale(locale as Locale);

  const t = useTranslations("pages.gdpr");

  return (
    <div className="relative">
      <Container size="sm" className="prose py-16">
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
          effectiveDate={t("effectiveDate")}
        />
      </Container>
    </div>
  );
}
