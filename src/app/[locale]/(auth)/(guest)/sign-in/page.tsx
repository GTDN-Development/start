import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/components/ui/link";
import { SIGN_UP_PATH } from "@/config/routes";
import {
  AuthHero,
  AuthHeroContent,
  AuthHeroDescription,
  AuthHeroTitle,
} from "@/features/auth/auth-page-shell";
import { SignInForm } from "@/features/auth/sign-in/sign-in-form";

export async function generateMetadata(props: PageProps<"/[locale]/sign-in">): Promise<Metadata> {
  const { locale } = await props.params;

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.signIn",
  });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function Page({ params }: PageProps<"/[locale]/sign-in">) {
  const { locale } = await params;

  // Enable static rendering
  setRequestLocale(locale as Locale);

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.signIn",
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
        <SignInForm />
        <p className="text-muted-foreground mt-6 text-sm">
          {t("newHere")}{" "}
          <Link
            href={SIGN_UP_PATH}
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
