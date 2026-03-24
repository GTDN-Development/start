import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";
import { APP_HOME_PATH, SIGN_IN_PATH } from "@/config/routes";
import { resolveApplicationEntryHref } from "@/features/application/application-entry";
import { InviteSignOutButton } from "../invite-sign-out-button";
import { InviteStatePanel } from "../invite-state-panel";
import { applyServerAuthCookies } from "@/server/auth/auth-cookies";
import { getServerAuthSession } from "@/server/auth/auth-service";
import { createPageMetadata } from "@/lib/metadata";
import type { AppHref } from "@/i18n/navigation";

type InviteResultPageProps = {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    state?: string | string[];
    invitedEmail?: string | string[];
    currentEmail?: string | string[];
  }>;
};

export async function generateMetadata(props: InviteResultPageProps): Promise<Metadata> {
  const { locale } = await props.params;

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.inviteToken",
  });

  return createPageMetadata({
    title: t("title"),
    description: t("description"),
    locale: locale as Locale,
    pathname: "/invite/result",
  });
}

export default async function Page({ params, searchParams }: InviteResultPageProps) {
  const { locale } = await params;
  const query = await searchParams;

  setRequestLocale(locale as Locale);

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.inviteToken",
  });
  const tCommonError = await getTranslations({
    locale: locale as Locale,
    namespace: "common.error",
  });
  const sessionResponse = await getServerAuthSession();

  await applyServerAuthCookies(sessionResponse.setCookie);

  const session = sessionResponse.ok ? sessionResponse.data.session : null;
  const applicationEntryHref = session ? await resolveApplicationEntryHref(session.user.id) : null;
  const inviteResultState = parseInviteResultState(query.state);
  const invitedEmail = getSingleQueryValue(query.invitedEmail);
  const currentEmail = getSingleQueryValue(query.currentEmail);

  if (inviteResultState === "email_mismatch") {
    return (
      <InviteStatePanel
        title={t("states.email_mismatch.title")}
        description={
          <>
            <p>{t("states.email_mismatch.description")}</p>
            {invitedEmail && currentEmail && (
              <p>
                {t.rich("states.email_mismatch.secondary", {
                  invitedEmail,
                  currentEmail,
                  strong: (chunks) => (
                    <strong className="text-foreground font-medium">{chunks}</strong>
                  ),
                })}
              </p>
            )}
          </>
        }
        action={
          session ? (
            <InviteSignOutButton
              label={t("states.email_mismatch.cta")}
              errorMessage={t("actions.signOutError")}
              redirectHref={SIGN_IN_PATH}
            />
          ) : (
            renderInviteLinkAction(tCommonError("goToSignIn"), SIGN_IN_PATH)
          )
        }
      />
    );
  }

  if (inviteResultState === "error") {
    return (
      <InviteStatePanel
        title={t("states.error.title")}
        description={t("states.error.description")}
        action={renderInviteLinkAction(
          session ? tCommonError("goToApp") : tCommonError("goToSignIn"),
          session ? (applicationEntryHref ?? APP_HOME_PATH) : SIGN_IN_PATH
        )}
      />
    );
  }

  return (
    <InviteStatePanel
      title={t("states.blocked.title")}
      description={t("states.blocked.description")}
      action={renderInviteLinkAction(
        session ? tCommonError("goToApp") : tCommonError("goToSignIn"),
        session ? (applicationEntryHref ?? APP_HOME_PATH) : SIGN_IN_PATH
      )}
    />
  );
}

function getSingleQueryValue(value: string | string[] | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalizedValue = value.trim();

  return normalizedValue ? normalizedValue : null;
}

function parseInviteResultState(
  value: string | string[] | undefined
): "email_mismatch" | "invalid_or_expired" | "error" | null {
  const normalizedValue = getSingleQueryValue(value);

  if (
    normalizedValue === "email_mismatch" ||
    normalizedValue === "invalid_or_expired" ||
    normalizedValue === "error"
  ) {
    return normalizedValue;
  }

  return null;
}

function renderInviteLinkAction(label: string, href: AppHref) {
  return (
    <Button
      size="lg"
      nativeButton={false}
      className="w-full"
      render={<Link href={href} className="w-full" />}
    >
      {label}
    </Button>
  );
}
