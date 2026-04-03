import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/components/ui/link";
import { SIGN_IN_PATH } from "@/config/routes";
import { ForgotPasswordForm } from "@/features/auth/forgot-password/forgot-password-form";
import {
  AuthHero,
  AuthHeroContent,
  AuthHeroDescription,
  AuthHeroTitle,
} from "@/features/auth/auth-page-shell";

export async function generateMetadata(
  props: PageProps<"/[locale]/forgot-password">
): Promise<Metadata> {
  const { locale } = await props.params;

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.forgotPassword",
  });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function Page({ params }: PageProps<"/[locale]/forgot-password">) {
  const { locale } = await params;

  setRequestLocale(locale as Locale);

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.forgotPassword",
  });

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
