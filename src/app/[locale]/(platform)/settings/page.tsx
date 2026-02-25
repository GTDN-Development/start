import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PlatformPage } from "@/components/layouts/platform/platform-page";
import { Container } from "@/components/ui/container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Hero, HeroContent, HeroDescription, HeroTitle } from "@/components/ui/hero";
import { createPageMetadata } from "@/lib/metadata";
import { createServerPocketBaseClient } from "@/lib/pocketbase/server";

type SettingsUser = {
  email: string;
  name: string | null;
  verified: boolean;
};

export async function generateMetadata(props: PageProps<"/[locale]/settings">): Promise<Metadata> {
  const { locale } = await props.params;

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.settings",
  });

  return createPageMetadata({
    title: t("title"),
    description: t("description"),
    pathname: "/settings",
  });
}

export default async function Page({ params }: PageProps<"/[locale]/settings">) {
  const { locale } = await params;

  setRequestLocale(locale as Locale);

  const [tSettings, tPlatform] = await Promise.all([
    getTranslations({
      locale: locale as Locale,
      namespace: "pages.settings",
    }),
    getTranslations({
      locale: locale as Locale,
      namespace: "layout.platform",
    }),
  ]);
  const pb = await createServerPocketBaseClient({ refreshAuth: true });
  const user = getSettingsUser(pb.authStore.record);
  const verificationStatus = user.verified ? tPlatform("emailVerified") : tPlatform("emailNotVerified");

  return (
    <PlatformPage>
      <div>
        <Hero>
          <HeroContent size="md">
            <HeroTitle>{tSettings("title")}</HeroTitle>
            <HeroDescription>{tSettings("description")}</HeroDescription>
          </HeroContent>
        </Hero>

        <Container size="xl" className="pb-24">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{tSettings("account.title")}</CardTitle>
                <CardDescription>{tSettings("account.description")}</CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="grid gap-4">
                  <div className="grid gap-1">
                    <dt className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                      {tSettings("account.nameLabel")}
                    </dt>
                    <dd className="text-sm font-medium">{user.name ?? tSettings("account.notSet")}</dd>
                  </div>
                  <div className="grid gap-1">
                    <dt className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                      {tSettings("account.emailLabel")}
                    </dt>
                    <dd className="text-sm font-medium">{user.email || tSettings("account.notSet")}</dd>
                  </div>
                  <div className="grid gap-1">
                    <dt className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                      {tSettings("account.verificationLabel")}
                    </dt>
                    <dd className="text-sm font-medium">{verificationStatus}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{tSettings("security.title")}</CardTitle>
                <CardDescription>{tSettings("security.description")}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="grid gap-4">
                  <li className="grid gap-1">
                    <p className="text-sm font-medium">{tSettings("security.passwordResetTitle")}</p>
                    <p className="text-muted-foreground text-sm">
                      {tSettings("security.passwordResetDescription")}
                    </p>
                  </li>
                  <li className="grid gap-1">
                    <p className="text-sm font-medium">{tSettings("security.emailChangeTitle")}</p>
                    <p className="text-muted-foreground text-sm">
                      {tSettings("security.emailChangeDescription")}
                    </p>
                  </li>
                  <li className="grid gap-1">
                    <p className="text-sm font-medium">{tSettings("security.sessionTitle")}</p>
                    <p className="text-muted-foreground text-sm">
                      {tSettings("security.sessionDescription")}
                    </p>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </Container>
      </div>
    </PlatformPage>
  );
}

function getSettingsUser(record: unknown): SettingsUser {
  if (typeof record !== "object" || record === null) {
    return {
      email: "",
      name: null,
      verified: false,
    };
  }

  const data = record as Record<string, unknown>;

  return {
    email: typeof data.email === "string" ? data.email : "",
    name: typeof data.name === "string" ? data.name : null,
    verified: typeof data.verified === "boolean" ? data.verified : false,
  };
}
