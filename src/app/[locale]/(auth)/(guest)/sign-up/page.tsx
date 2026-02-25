import type { Metadata } from "next";
import { Locale, useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";
import { Link } from "@/components/ui/link";
import { SignUpForm } from "@/components/(auth)/sign-up/sign-up-form";
import { AuthPage } from "@/components/layouts/auth/auth-page";
import { createPageMetadata } from "@/lib/metadata";

export async function generateMetadata(props: PageProps<"/[locale]/sign-up">): Promise<Metadata> {
  const { locale } = await props.params;

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.signUp",
  });

  return createPageMetadata({
    title: t("title"),
    description: t("description"),
    pathname: "/sign-up",
  });
}

export default function Page({ params }: PageProps<"/[locale]/sign-up">) {
  const { locale } = use(params);

  // Enable static rendering
  setRequestLocale(locale as Locale);

  const t = useTranslations("pages.signUp");

  return (
    <AuthPage>
      <section className="space-y-6">
        <header className="space-y-3 text-center">
          <h1 className="text-3xl/[1.1] font-semibold tracking-tight text-pretty sm:text-4xl/[1.1]">
            {t("title")}
          </h1>
          <p className="text-muted-foreground text-sm text-pretty sm:text-base">
            {t("description")}
          </p>
        </header>

        <div className="pt-6">
          <SignUpForm />
          <p className="text-muted-foreground mt-6 text-sm">
            {t("alreadyHaveAccount")}{" "}
            <Link
              href="/login"
              className="underline decoration-current/30 hover:decoration-current"
            >
              {t("logIn")}
            </Link>
            .
          </p>
        </div>
      </section>
    </AuthPage>
  );
}
