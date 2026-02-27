import type { Metadata } from "next";
import { Locale, useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";
import { ConfirmEmailChangeForm } from "@/features/auth/confirm-email-change/confirm-email-change-form";
import {
  AuthHero,
  AuthHeroContent,
  AuthHeroDescription,
  AuthHeroTitle,
} from "@/features/auth/auth-page-shell";
import { Link } from "@/components/ui/link";
import { parseAuthFlowToken } from "@/features/auth/auth-flow-token";
import { createPageMetadata } from "@/lib/metadata";

type ConfirmEmailChangePageProps = {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    token?: string | string[];
  }>;
};

export async function generateMetadata(props: ConfirmEmailChangePageProps): Promise<Metadata> {
  const { locale } = await props.params;

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.confirmEmailChange",
  });

  return createPageMetadata({
    title: t("title"),
    description: t("description"),
    locale: locale as Locale,
    pathname: "/confirm-email-change",
  });
}

export default function Page({ params, searchParams }: ConfirmEmailChangePageProps) {
  const { locale } = use(params);
  const query = use(searchParams);

  setRequestLocale(locale as Locale);

  const t = useTranslations("pages.confirmEmailChange");
  const token = parseAuthFlowToken(query.token);

  return (
    <div className="relative">
      <AuthHero>
        <AuthHeroContent>
          <AuthHeroTitle>{t("title")}</AuthHeroTitle>
          <AuthHeroDescription>{t("description")}</AuthHeroDescription>
        </AuthHeroContent>
      </AuthHero>

      <div className="mt-6 pt-6">
        <ConfirmEmailChangeForm token={token} />
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
