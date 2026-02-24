import type { Metadata } from "next";
import { Locale, useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";
import { Link } from "@/components/ui/link";
import { ForgotPasswordForm } from "@/components/(auth)/forgot-password/forgot-password-form";
import { AuthPage } from "@/components/layouts/auth/auth-page";
import { site } from "@/config/site";

export async function generateMetadata(
  props: PageProps<"/[locale]/forgot-password">
): Promise<Metadata> {
  const { locale } = await props.params;

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.forgotPassword",
  });

  return {
    metadataBase: new URL(site.url),
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: "/forgot-password",
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: `${site.url}/forgot-password`,
    },
    twitter: {
      title: t("title"),
      description: t("description"),
    },
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default function Page({ params }: PageProps<"/[locale]/forgot-password">) {
  const { locale } = use(params);

  setRequestLocale(locale as Locale);

  const t = useTranslations("pages.forgotPassword");

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
          <ForgotPasswordForm />
          <p className="text-muted-foreground mt-6 text-sm">
            <Link
              href="/login"
              className="underline decoration-current/30 hover:decoration-current"
            >
              {t("backToLogin")}
            </Link>
            .
          </p>
        </div>
      </section>
    </AuthPage>
  );
}
