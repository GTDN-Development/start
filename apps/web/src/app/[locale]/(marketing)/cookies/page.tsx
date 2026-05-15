import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { cookieCatalog, cookiePolicy, cookiePolicyUpdatedAt } from "@/config/legal/cookies";
import { product } from "@/config/product";
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
  }).format(new Date(cookiePolicyUpdatedAt));

  // Enable static rendering
  setRequestLocale(locale as Locale);

  return (
    <div className="relative">
      <Container size="sm" className="prose py-16">
        <CookiePolicy
          company={{
            name: product.company.legalName,
            address: product.company.address,
            id: product.company.id,
            domain: product.site.domain,
          }}
          contact={{
            email: product.company.contact.email,
            phone: product.company.contact.phone,
          }}
          policy={cookiePolicy}
          cookies={cookieCatalog}
          effectiveDate={formattedEffectiveDate}
        />
      </Container>
    </div>
  );
}
