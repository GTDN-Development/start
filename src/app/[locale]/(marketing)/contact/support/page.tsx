import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeftIcon } from "lucide-react";
import { BackLink } from "@/components/ui/back-navigation";
import { Link } from "@/components/ui/link";
import { SupportForm } from "@/features/marketing/contact/support-form";
import { Container } from "@/components/ui/container";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createPageMetadata } from "@/lib/metadata";
import { ContactCopyItem } from "@/features/marketing/contact/contact-copy-item";
import { getServerAuthSession } from "@/server/auth/auth-service";
import { legal } from "@/config/legal";

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await props.params;

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.contact.support",
  });

  return createPageMetadata({
    title: t("infoTitle"),
    description: t("infoDescription"),
    locale: locale as Locale,
    pathname: "/contact/support",
  });
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  setRequestLocale(locale as Locale);

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.contact.support",
  });
  const tContact = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.contact",
  });
  const tCommonNavigation = await getTranslations({
    locale: locale as Locale,
    namespace: "common.navigation",
  });
  const tSupportForm = await getTranslations({
    locale: locale as Locale,
    namespace: "forms.support",
  });
  const sessionResponse = await getServerAuthSession();
  const isAuthenticated = sessionResponse.ok && Boolean(sessionResponse.data.session);

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
                    {tCommonNavigation("back")}
                  </>
                }
              >
                <ArrowLeftIcon aria-hidden="true" className="size-4" />
                {tContact("backToContact")}
              </BackLink>
              <h1 className="font-heading mt-2 text-3xl font-bold tracking-tight md:text-4xl">
                {t("infoTitle")}
              </h1>
              <p className="text-muted-foreground">{t("infoDescription")}</p>
            </div>
            <ContactCopyItem
              value={legal.contact.support.email}
              buttonClassName="hover:text-primary"
            />
          </div>

          <Card>
            <CardContent className="flex flex-1 flex-col justify-center">
              {isAuthenticated ? (
                <SupportForm />
              ) : (
                <div className="flex flex-col items-center gap-6 py-6 text-center">
                  <div className="flex flex-col gap-2">
                    <p className="font-heading text-lg font-semibold tracking-tight">
                      {tSupportForm("loginGate.title")}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {tSupportForm("loginGate.description")}
                    </p>
                  </div>
                  <Button nativeButton={false} render={<Link href="/sign-in" />} className="w-fit">
                    {tSupportForm("loginGate.button")}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </Container>
    </div>
  );
}
