import type { Metadata } from "next";
import { Locale, useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";
import { Link } from "@/components/ui/link";
import { LoginForm } from "@/components/(auth)/login/login-form";
import { AuthPage } from "@/components/layouts/auth/auth-page";
import { createPageMetadata } from "@/lib/metadata";

export async function generateMetadata(props: PageProps<"/[locale]/login">): Promise<Metadata> {
  const { locale } = await props.params;

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.login",
  });

  return createPageMetadata({
    title: t("title"),
    description: t("description"),
    pathname: "/login",
  });
}

export default function Page({ params }: PageProps<"/[locale]/login">) {
  const { locale } = use(params);

  // Enable static rendering
  setRequestLocale(locale as Locale);

  const t = useTranslations("pages.login");

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
          <LoginForm />
          <p className="mt-4 text-sm">
            <Link
              href="/forgot-password"
              className="underline decoration-current/30 hover:decoration-current"
            >
              {t("forgotPassword")}
            </Link>
            .
          </p>
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
      </section>
    </AuthPage>
  );
}
