import type { Metadata } from "next";
import { Locale, useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";
import { ConfirmEmailChangeForm } from "@/components/(auth)/confirm-email-change/confirm-email-change-form";
import { Link } from "@/components/ui/link";
import { AuthPage } from "@/components/layouts/auth/auth-page";
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
    pathname: "/confirm-email-change",
  });
}

export default function Page({ params, searchParams }: ConfirmEmailChangePageProps) {
  const { locale } = use(params);
  const query = use(searchParams);

  setRequestLocale(locale as Locale);

  const t = useTranslations("pages.confirmEmailChange");
  const token = getTokenFromSearchParams(query.token);

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
          <ConfirmEmailChangeForm token={token} />
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

function getTokenFromSearchParams(value: string | string[] | undefined) {
  if (typeof value === "string") {
    return value.trim() || null;
  }

  if (Array.isArray(value) && typeof value[0] === "string") {
    return value[0].trim() || null;
  }

  return null;
}
