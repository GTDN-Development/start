import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Container } from "@/components/ui/container";
import { Link } from "@/components/ui/link";
import { product } from "@/config/product";
import { APP_HOME_PATH } from "@/config/routes";
import {
  ApplicationPageHero,
  ApplicationPageHeroContent,
  ApplicationPageHeroDescription,
  ApplicationPageHeroTitle,
} from "@/features/application/application-page-hero";
import { ApplicationPageShell } from "@/features/application/application-page-shell";
import { PdfDemoForm } from "@/features/pdf/pdf-demo-form";
import { AUTH_REDIRECTS } from "@/config/auth";
import { redirect } from "@/i18n/navigation";
import { requireCurrentUser } from "@/server/auth/auth-session-service";
import { getNullableTrimmedString } from "@/server/pocketbase/pocketbase-utils";

export async function generateMetadata(
  props: PageProps<"/[locale]/app/pdf-demo">
): Promise<Metadata> {
  const { locale } = await props.params;

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.pdfDemo",
  });

  return {
    title: t("user.title"),
    description: t("user.description"),
  };
}

export default async function Page({ params }: PageProps<"/[locale]/app/pdf-demo">) {
  const { locale } = await params;
  const currentLocale = locale as Locale;

  setRequestLocale(currentLocale);

  const currentUser = await requireCurrentUser();

  if (!currentUser.ok) {
    redirect({
      href: AUTH_REDIRECTS.unauthenticatedTo,
      locale: currentLocale,
    });

    return null;
  }

  const [t, tNav] = await Promise.all([
    getTranslations({
      locale: currentLocale,
      namespace: "pages.pdfDemo",
    }),
    getTranslations({
      locale: currentLocale,
      namespace: "layout.navigation.items",
    }),
  ]);
  const userName = getNullableTrimmedString(currentUser.user.name) ?? currentUser.user.email;

  return (
    <ApplicationPageShell
      breadcrumbs={
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href={APP_HOME_PATH} />}>{tNav("home")}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{tNav("pdfDemo")}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      }
    >
      <ApplicationPageHero>
        <ApplicationPageHeroContent size="xl">
          <ApplicationPageHeroTitle>{t("user.title")}</ApplicationPageHeroTitle>
          <ApplicationPageHeroDescription>{t("user.description")}</ApplicationPageHeroDescription>
        </ApplicationPageHeroContent>
      </ApplicationPageHero>

      <Container size="xl" className="pt-4 pb-24">
        <PdfDemoForm
          scope={{
            type: "user",
            name: userName,
          }}
          appName={product.site.name}
          defaultDocumentTitle={t("defaults.documentTitle")}
          defaultItems={[
            {
              id: "user-item-1",
              name: t("defaults.firstItemName"),
              price: "16 000 CZK",
            },
            {
              id: "user-item-2",
              name: t("defaults.secondItemName"),
              price: "8 000 CZK",
            },
          ]}
        />
      </Container>
    </ApplicationPageShell>
  );
}
