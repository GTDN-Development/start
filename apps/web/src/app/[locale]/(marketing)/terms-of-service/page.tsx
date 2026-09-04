import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { termsOfService, termsOfServiceUpdatedAt } from "@/config/legal/terms";
import { product } from "@/config/product";
import { TermsOfService } from "@/features/marketing/legal/terms-of-service";

export async function generateMetadata(
  props: PageProps<"/[locale]/terms-of-service">
): Promise<Metadata> {
  const { locale } = await props.params;

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.termsOfService",
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

export default async function Page({ params }: PageProps<"/[locale]/terms-of-service">) {
  const { locale } = await params;
  const formattedEffectiveDate = new Intl.DateTimeFormat(locale as Locale, {
    dateStyle: "long",
  }).format(new Date(termsOfServiceUpdatedAt));

  // Enable static rendering
  setRequestLocale(locale as Locale);

  return (
    <div className="relative">
      <Container size="sm" className="py-16">
        <div className="typeset typeset-docs max-w-[37em]">
          <TermsOfService
            company={{
              name: product.company.name,
              legalName: product.company.legalName,
              address: product.company.address,
              id: product.company.id,
              domain: product.site.domain,
              vatId: product.company.vatId,
              registration: product.company.registration,
            }}
            contact={{
              email: product.company.contact.email,
              phone: product.company.contact.phone,
            }}
            terms={termsOfService}
            effectiveDate={formattedEffectiveDate}
          />
        </div>
      </Container>
    </div>
  );
}
