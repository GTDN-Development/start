import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { cookieCatalog, cookiePolicy, legal, legalDocumentDates } from "@/config/legal";
import { CookiePolicy } from "@/features/marketing/legal/cookie-policy";

export async function generateMetadata(props: PageProps<"/[locale]/cookies">): Promise<Metadata> {
  const { locale } = await props.params;

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.cookies",
  });

  return {
    title: t("title"),
    description: t("description"),
    robots: {
      index: false,
      follow: true,
    },
  };
}

export default async function Page({ params }: PageProps<"/[locale]/cookies">) {
  const { locale } = await params;
  const formattedEffectiveDate = new Intl.DateTimeFormat(locale as Locale, {
    dateStyle: "long",
  }).format(new Date(legalDocumentDates.cookiePolicy));

  // Enable static rendering
  setRequestLocale(locale as Locale);

  return (
    <div className="relative">
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
          policy={cookiePolicy}
          cookies={cookieCatalog}
          effectiveDate={formattedEffectiveDate}
        />
      </Container>
    </div>
  );
}
