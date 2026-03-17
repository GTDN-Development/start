import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/components/ui/link";
import { SupportForm } from "@/features/marketing/contact/support-form";
import { Container } from "@/components/ui/container";
// import { Hero, HeroContent, HeroDescription, HeroTitle } from "@/components/ui/hero";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createPageMetadata } from "@/lib/metadata";
import { ContactCopyItem } from "@/features/marketing/contact/contact-copy-item";
import { getServerAuthSession } from "@/server/auth/auth-service";

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await props.params;

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.contact.support",
  });

  return createPageMetadata({
    title: t("title"),
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
  const tSupportForm = await getTranslations({
    locale: locale as Locale,
    namespace: "forms.support",
  });
  const sessionResponse = await getServerAuthSession();
  const isAuthenticated = sessionResponse.ok && Boolean(sessionResponse.data.session);

  return (
    <div className="relative pt-20">
      {/*<Hero>
        <HeroContent size="md">
          <HeroTitle>{t("title")}</HeroTitle>
          <HeroDescription>{t("infoDescription")}</HeroDescription>
        </HeroContent>
      </Hero>*/}

      <Container className="pb-24">
        <div className="grid gap-12 md:grid-cols-2">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <h2 className="text-2xl font-bold tracking-tight">{t("infoTitle")}</h2>
              <p className="text-muted-foreground">{t("infoDescription")}</p>
            </div>
            <div>
              <Button variant="secondary" size="lg">
                {t("infoButton")}
              </Button>
            </div>
            <div className="flex flex-col gap-4">
              <ContactCopyItem label="Email" value={t("email")} />
              <ContactCopyItem label="Phone" value={t("phone")} />
            </div>
          </div>

          <Card>
            <CardContent className="flex flex-1 flex-col justify-center">
              {isAuthenticated ? (
                <SupportForm />
              ) : (
                <div className="flex flex-col items-center gap-6 py-6 text-center">
                  <div className="flex flex-col gap-2">
                    <p className="text-lg font-semibold tracking-tight">
                      {tSupportForm("loginGate.title")}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {tSupportForm("loginGate.description")}
                    </p>
                  </div>
                  <Button
                    nativeButton={false}
                    render={<Link href="/sign-in" />}
                    className="w-fit"
                  >
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
