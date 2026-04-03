import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/components/ui/link";
import { SIGN_IN_PATH } from "@/config/routes";
import {
  AuthHero,
  AuthHeroContent,
  AuthHeroDescription,
  AuthHeroTitle,
} from "@/features/auth/auth-page-shell";
import { SignUpForm } from "@/features/auth/sign-up/sign-up-form";

export async function generateMetadata(props: PageProps<"/[locale]/sign-up">): Promise<Metadata> {
  const { locale } = await props.params;

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.signUp",
  });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function Page({ params }: PageProps<"/[locale]/sign-up">) {
  const { locale } = await params;

  // Enable static rendering
  setRequestLocale(locale as Locale);

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.signUp",
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
        <SignUpForm />
        <p className="text-muted-foreground mt-6 text-sm">
          {t("alreadyHaveAccount")}{" "}
          <Link
            href={SIGN_IN_PATH}
            className="underline decoration-current/30 hover:decoration-current"
          >
            {t("signIn")}
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
