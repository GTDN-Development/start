import type { Metadata } from "next";
import { Locale, useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";
import { Link } from "@/components/ui/link";
import { ForgotPasswordForm } from "@/components/auth/forgot-password/forgot-password-form";
import {
  AuthHero,
  AuthHeroContent,
  AuthHeroDescription,
  AuthHeroTitle,
} from "@/components/auth/auth-hero";
import { createPageMetadata } from "@/lib/metadata";

export async function generateMetadata(
  props: PageProps<"/[locale]/forgot-password">
): Promise<Metadata> {
  const { locale } = await props.params;

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.forgotPassword",
  });

  return createPageMetadata({
    title: t("title"),
    description: t("description"),
    locale: locale as Locale,
    pathname: "/forgot-password",
  });
}

export default function Page({ params }: PageProps<"/[locale]/forgot-password">) {
  const { locale } = use(params);

  setRequestLocale(locale as Locale);

  const t = useTranslations("pages.forgotPassword");

  return (
    <div className="relative">
      <AuthHero>
        <AuthHeroContent>
          <AuthHeroTitle>{t("title")}</AuthHeroTitle>
          <AuthHeroDescription>{t("description")}</AuthHeroDescription>
        </AuthHeroContent>
      </AuthHero>

      <div className="mt-6 pt-6">
        <ForgotPasswordForm />
        <p className="text-muted-foreground mt-6 text-sm">
          <Link href="/login" className="underline decoration-current/30 hover:decoration-current">
            {t("backToLogin")}
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
