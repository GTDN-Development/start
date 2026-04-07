import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { legal, legalDocumentDates } from "@/config/legal";
import { termsOfService } from "@/config/legal";
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
  }).format(new Date(legalDocumentDates.termsOfService));

  // Enable static rendering
  setRequestLocale(locale as Locale);

  return (
    <div className="relative">
      <Container size="sm" className="prose py-16">
        <TermsOfService
          company={{
            name: legal.name,
            legalName: legal.legalName,
            address: legal.address,
            id: legal.id,
            domain: legal.domain,
            vatId: legal.vatId,
            registration: legal.registration,
          }}
          contact={{
            email: legal.contact.email,
            phone: legal.contact.phone,
          }}
          terms={termsOfService}
          effectiveDate={formattedEffectiveDate}
        />
      </Container>
    </div>
  );
}
