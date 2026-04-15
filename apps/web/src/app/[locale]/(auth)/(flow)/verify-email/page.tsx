import { Suspense } from "react";
import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import {
  AuthHero,
  AuthHeroContent,
  AuthHeroDescription,
  AuthHeroTitle,
} from "@/features/auth/auth-page-shell";
import { VerifyEmailForm } from "@/features/auth/verify-email/verify-email-form";
import {
  createVerifyEmailCompletionHref,
  parseVerifyEmailPageState,
  type VerifyEmailPageState,
} from "@/features/auth/verify-email/verify-email-state";

type VerifyEmailPageProps = {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    token?: string | string[];
    email?: string | string[];
    result?: string | string[];
    delivery?: string | string[];
  }>;
};

export async function generateMetadata(props: VerifyEmailPageProps): Promise<Metadata> {
  const { locale } = await props.params;

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.verifyEmail",
  });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default function Page({ params, searchParams }: VerifyEmailPageProps) {
  return (
    <Suspense fallback={null}>
      <VerifyEmailPageContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function VerifyEmailPageContent({ params, searchParams }: VerifyEmailPageProps) {
  const { locale } = await params;
  const query = await searchParams;

  setRequestLocale(locale as Locale);

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.verifyEmail",
  });
  const state = parseVerifyEmailPageState(query);

  if (state.token) {
    redirect({
      href: createVerifyEmailCompletionHref({
        token: state.token,
        email: state.email,
      }),
      locale: locale as Locale,
    });
  }

  const pageState = getPageCopyState(state);

  return (
    <div className="relative">
      <AuthHero>
        <AuthHeroContent>
          <AuthHeroTitle>{t(`states.${pageState}.title`)}</AuthHeroTitle>
          <AuthHeroDescription>{t(`states.${pageState}.description`)}</AuthHeroDescription>
        </AuthHeroContent>
      </AuthHero>

      <div className="mt-6 pt-6">
        <VerifyEmailForm email={state.email} result={state.result} delivery={state.delivery} />
      </div>
    </div>
  );
}

function getPageCopyState(state: VerifyEmailPageState) {
  if (state.result === "verified") {
    return "verified";
  }

  if (state.result === "invalid") {
    return "invalid";
  }

  return "pending";
}
