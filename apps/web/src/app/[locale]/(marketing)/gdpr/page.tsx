import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { gdprPolicy, gdprPolicyUpdatedAt } from "@/config/legal/privacy";
import { product } from "@/config/product";
import { GdprPolicy } from "@/features/marketing/legal/gdpr-policy";

export async function generateMetadata(props: PageProps<"/[locale]/gdpr">): Promise<Metadata> {
  const { locale } = await props.params;

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.gdpr",
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

export default async function Page({ params }: PageProps<"/[locale]/gdpr">) {
  const { locale } = await params;
  const formattedEffectiveDate = new Intl.DateTimeFormat(locale as Locale, {
    dateStyle: "long",
  }).format(new Date(gdprPolicyUpdatedAt));

  // Enable static rendering
  setRequestLocale(locale as Locale);

  return (
    <div className="relative">
      <Container size="sm" className="prose py-16">
        <GdprPolicy
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
          policy={gdprPolicy}
          effectiveDate={formattedEffectiveDate}
        />
      </Container>
    </div>
  );
}
