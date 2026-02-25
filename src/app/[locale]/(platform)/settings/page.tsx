import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createPageMetadata } from "@/lib/metadata";
import { createServerPocketBaseClient } from "@/server/pocketbase/server";
import {
  PlatformHero,
  PlatformHeroContent,
  PlatformHeroDescription,
  PlatformHeroTitle,
} from "@/components/platform/platform-hero";

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
    locale: locale as Locale,
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

  const pb = await createServerPocketBaseClient();
  const user = getSettingsUser(pb.authStore.record);
  const verificationStatus = user.verified
    ? tPlatform("emailVerified")
    : tPlatform("emailNotVerified");

  return (
    <div className="relative">
      <PlatformHero>
        <PlatformHeroContent>
          <PlatformHeroTitle>{tSettings("title")}</PlatformHeroTitle>
          <PlatformHeroDescription>{tSettings("description")}</PlatformHeroDescription>
        </PlatformHeroContent>
      </PlatformHero>

      <Container className="pb-24">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{tSettings("account.title")}</CardTitle>
              <CardDescription>{tSettings("account.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4">
                <div className="grid gap-1">
                  <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                    {tSettings("account.nameLabel")}
                  </dt>
                  <dd className="text-sm font-medium">
                    {user.name ?? tSettings("account.notSet")}
                  </dd>
                </div>
                <div className="grid gap-1">
                  <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                    {tSettings("account.emailLabel")}
                  </dt>
                  <dd className="text-sm font-medium">
                    {user.email || tSettings("account.notSet")}
                  </dd>
                </div>
                <div className="grid gap-1">
                  <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
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
