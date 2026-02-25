import type { Metadata } from "next";
import { Locale, useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";
import { Link } from "@/components/ui/link";
import { ResetPasswordForm } from "@/components/auth/reset-password/reset-password-form";
import {
  AuthHero,
  AuthHeroContent,
  AuthHeroDescription,
  AuthHeroTitle,
} from "@/components/auth/auth-hero";
import { createPageMetadata } from "@/lib/metadata";

export async function generateMetadata(
  props: PageProps<"/[locale]/reset-password">
): Promise<Metadata> {
  const { locale } = await props.params;

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.resetPassword",
  });

  return createPageMetadata({
    title: t("title"),
    description: t("description"),
    locale: locale as Locale,
    pathname: "/reset-password",
  });
}

export default function Page({ params, searchParams }: PageProps<"/[locale]/reset-password">) {
  const { locale } = use(params);
  const query = use(searchParams);

  setRequestLocale(locale as Locale);

  const t = useTranslations("pages.resetPassword");
  const token = getTokenFromSearchParams(query.token);

  return (
    <div className="relative">
      <AuthHero>
        <AuthHeroContent>
          <AuthHeroTitle>{t("title")}</AuthHeroTitle>
          <AuthHeroDescription>{t("description")}</AuthHeroDescription>
        </AuthHeroContent>
      </AuthHero>

      <div className="mt-6 pt-6">
        <ResetPasswordForm token={token} />
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

function getTokenFromSearchParams(value: string | string[] | undefined) {
  if (typeof value === "string") {
    return value.trim() || null;
  }

  if (Array.isArray(value) && typeof value[0] === "string") {
    return value[0].trim() || null;
  }

  return null;
}
