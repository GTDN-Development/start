import type { Metadata } from "next";
import { Locale, useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";
import { Link } from "@/components/ui/link";
import {
  AuthHero,
  AuthHeroContent,
  AuthHeroDescription,
  AuthHeroTitle,
} from "@/features/auth/auth-page-shell";
import { LoginForm } from "@/features/auth/login/login-form";
import { createPageMetadata } from "@/lib/metadata";

export async function generateMetadata(props: PageProps<"/[locale]/login">): Promise<Metadata> {
  const { locale } = await props.params;

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.login",
  });

  return createPageMetadata({
    title: t("title"),
    description: t("description"),
    locale: locale as Locale,
    pathname: "/login",
  });
}

export default function Page({ params }: PageProps<"/[locale]/login">) {
  const { locale } = use(params);

  // Enable static rendering
  setRequestLocale(locale as Locale);

  const t = useTranslations("pages.login");

  return (
    <div className="relative">
      <AuthHero>
        <AuthHeroContent>
          <AuthHeroTitle>{t("title")}</AuthHeroTitle>
          <AuthHeroDescription>{t("description")}</AuthHeroDescription>
        </AuthHeroContent>
      </AuthHero>

      <div className="mt-6 pt-6">
        <LoginForm />
        <p className="mt-4 text-sm">
          <Link
            href="/forgot-password"
            className="underline decoration-current/30 hover:decoration-current"
          >
            {t("forgotPassword")}
          </Link>
          .
        </p>
        <p className="text-muted-foreground mt-6 text-sm">
          {t("newHere")}{" "}
          <Link
            href="/sign-up"
            className="underline decoration-current/30 hover:decoration-current"
          >
            {t("createAccount")}
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
