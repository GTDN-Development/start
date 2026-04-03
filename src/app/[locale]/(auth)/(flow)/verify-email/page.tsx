import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { VerifyEmailForm } from "@/features/auth/verify-email/verify-email-form";
import {
  AuthHero,
  AuthHeroContent,
  AuthHeroDescription,
  AuthHeroTitle,
} from "@/features/auth/auth-page-shell";
import {
  APP_HOME_PATH,
  VERIFY_EMAIL_PATH,
  getInviteHref,
  getWorkspaceOverviewHref,
} from "@/config/routes";
import { redirect } from "@/i18n/navigation";
import { applyServerAuthCookies } from "@/server/auth/auth-cookies";
import { confirmEmailVerificationToken } from "@/server/auth/auth-email-verification-service";
import { setActiveWorkspaceSlugCookie } from "@/server/workspaces/workspace-cookie";
import { resolvePostAuthDestination } from "@/server/workspaces/workspace-resolution-service";
import {
  createVerifyEmailResultHref,
  parseVerifyEmailPageState,
  type VerifyEmailPageState,
} from "@/features/auth/verify-email/verify-email-state";
import { createPageMetadata } from "@/lib/metadata";

type VerifyEmailPageProps = {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    token?: string | string[];
    email?: string | string[];
    result?: string | string[];
  }>;
};

export async function generateMetadata(props: VerifyEmailPageProps): Promise<Metadata> {
  const { locale } = await props.params;

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.verifyEmail",
  });

  return createPageMetadata({
    title: t("title"),
    description: t("description"),
    locale: locale as Locale,
    pathname: VERIFY_EMAIL_PATH,
  });
}

export default async function Page({ params, searchParams }: VerifyEmailPageProps) {
  const { locale } = await params;
  const query = await searchParams;

  setRequestLocale(locale as Locale);

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.verifyEmail",
  });
  const state = parseVerifyEmailPageState(query);

  if (state.token) {
    await handleVerificationToken(locale as Locale, state);
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
        <VerifyEmailForm email={state.email} result={state.result} />
      </div>
    </div>
  );
}

async function handleVerificationToken(locale: Locale, state: VerifyEmailPageState) {
  const response = await confirmEmailVerificationToken(state.token!);

  await applyServerAuthCookies(response.setCookie);

  if (!response.ok) {
    redirect({
      href: createVerifyEmailResultHref({
        result: "invalid",
        email: state.email,
      }),
      locale,
    });

    return;
  }

  const session = response.data.session;

  if (session) {
    await redirectToPostAuthDestination(locale, session.user.id, session.user.email);
    return;
  }

  redirect({
    href: createVerifyEmailResultHref({
      result: "verified",
      email: state.email,
    }),
    locale,
  });
}

async function redirectToPostAuthDestination(locale: Locale, userId: string, userEmail: string) {
  const destinationResponse = await resolvePostAuthDestination({
    userId,
    userEmail,
  });

  await applyServerAuthCookies(destinationResponse.setCookie);

  if (!destinationResponse.ok) {
    redirect({
      href: APP_HOME_PATH,
      locale,
    });

    return;
  }

  const destination = destinationResponse.data;

  if (destination.state === "workspace_redirect") {
    await setActiveWorkspaceSlugCookie(destination.workspaceSlug);

    redirect({
      href: getWorkspaceOverviewHref(destination.workspaceSlug),
      locale,
    });

    return;
  }

  if (destination.state === "invite_redirect") {
    redirect({
      href: getInviteHref(destination.inviteToken),
      locale,
    });

    return;
  }

  redirect({
    href: APP_HOME_PATH,
    locale,
  });
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
