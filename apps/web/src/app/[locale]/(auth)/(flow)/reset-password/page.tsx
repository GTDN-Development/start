import { Suspense } from "react";
import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/components/ui/link";
import { SIGN_IN_PATH } from "@/config/routes";
import { ResetPasswordForm } from "@/features/auth/reset-password/reset-password-form";
import {
  AuthHero,
  AuthHeroContent,
  AuthHeroDescription,
  AuthHeroTitle,
} from "@/features/auth/auth-page-shell";
import { parseAuthFlowToken } from "@/features/auth/auth-flow-token";

type ResetPasswordPageProps = PageProps<"/[locale]/reset-password">;

export async function generateMetadata(props: ResetPasswordPageProps): Promise<Metadata> {
  const { locale } = await props.params;

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.resetPassword",
  });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default function Page({ params, searchParams }: ResetPasswordPageProps) {
  return (
    <Suspense fallback={null}>
      <ResetPasswordPageContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function ResetPasswordPageContent({ params, searchParams }: ResetPasswordPageProps) {
  const { locale } = await params;
  const query = await searchParams;

  setRequestLocale(locale as Locale);

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.resetPassword",
  });
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
        <ResetPasswordForm token={token} />
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
