import type { Metadata } from "next";
import { Locale, useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";
import { CookiePolicy } from "@/components/(marketing)/legal/cookie-policy";
import { MarketingPage } from "@/components/layouts/marketing/marketing-page";
import { Container } from "@/components/ui/container";
import { legal } from "@/config/legal";
import { cookies } from "@/config/cookies";
import { createPageMetadata } from "@/lib/metadata";

export async function generateMetadata(props: PageProps<"/[locale]/cookies">): Promise<Metadata> {
  const { locale } = await props.params;

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.cookies",
  });

  return createPageMetadata({
    title: t("title"),
    description: t("description"),
    locale: locale as Locale,
    pathname: "/cookies",
    robots: {
      index: false,
      follow: true,
    },
  });
}

export default function Page({ params }: PageProps<"/[locale]/cookies">) {
  const { locale } = use(params);

  // Enable static rendering
  setRequestLocale(locale as Locale);

  const t = useTranslations("pages.cookies");

  return (
    <MarketingPage>
      <Container size="sm" className="prose py-16">
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
    </MarketingPage>
  );
}
