import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/components/ui/link";
import {
  AuthHero,
  AuthHeroContent,
  AuthHeroDescription,
  AuthHeroTitle,
} from "@/features/auth/auth-page-shell";
import { SignInFlashToast } from "@/features/auth/sign-in/sign-in-flash-toast";
import { SignInForm } from "@/features/auth/sign-in/sign-in-form";
import { createPageMetadata } from "@/lib/metadata";

export async function generateMetadata(props: PageProps<"/[locale]/sign-in">): Promise<Metadata> {
  const { locale } = await props.params;

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.signIn",
  });

  return createPageMetadata({
    title: t("title"),
    description: t("description"),
    locale: locale as Locale,
    pathname: "/sign-in",
  });
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
        <SignInFlashToast />
        <SignInForm />
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
