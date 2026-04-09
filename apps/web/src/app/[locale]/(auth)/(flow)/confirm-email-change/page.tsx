import { Suspense } from "react";
import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ConfirmEmailChangeForm } from "@/features/auth/confirm-email-change/confirm-email-change-form";
import {
  AuthHero,
  AuthHeroContent,
  AuthHeroDescription,
  AuthHeroTitle,
} from "@/features/auth/auth-page-shell";
import { Link } from "@/components/ui/link";
import { SIGN_IN_PATH } from "@/config/routes";

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

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default function Page({ params, searchParams }: ConfirmEmailChangePageProps) {
  return (
    <Suspense fallback={null}>
      <ConfirmEmailChangePageContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function ConfirmEmailChangePageContent({
  params,
  searchParams,
}: ConfirmEmailChangePageProps) {
  const { locale } = await params;
  const query = await searchParams;

  setRequestLocale(locale as Locale);

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.confirmEmailChange",
  });
  const token = getSingleQueryValue(query.token);

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
          <Link
            href={SIGN_IN_PATH}
            className="underline decoration-current/30 hover:decoration-current"
          >
            {t("backToSignIn")}
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

function getSingleQueryValue(value: string | string[] | undefined): string | null {
  if (typeof value === "string") {
    const normalizedValue = value.trim();

    return normalizedValue ? normalizedValue : null;
  }

  if (Array.isArray(value) && typeof value[0] === "string") {
    const normalizedValue = value[0].trim();

    return normalizedValue ? normalizedValue : null;
  }

  return null;
}
