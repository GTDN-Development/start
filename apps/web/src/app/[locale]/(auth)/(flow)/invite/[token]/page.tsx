import type { Metadata } from "next";
import { connection } from "next/server";
import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/components/ui/link";
import { Button } from "@/components/ui/button";
import {
  SIGN_IN_PATH,
  getInviteAcceptHref,
  getInviteHref,
  getInviteStartHref,
} from "@/config/routes";
import { resolveApplicationEntryHref } from "@/server/application/application-entry-href";
import { getPathname, redirect } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { getServerAuthSession } from "@/server/auth/auth-session-service";
import {
  getInviteTokenForUser,
  validateInviteToken,
} from "@/server/workspaces/workspace-invite-recipient-service";
import { InviteSignOutButton } from "@/features/auth/invite/invite-sign-out-button";
import { InviteStatePanel } from "@/features/auth/invite/invite-state-panel";

type InviteTokenPageProps = {
  params: Promise<{
    locale: string;
    token: string;
  }>;
};

export async function generateMetadata(props: InviteTokenPageProps): Promise<Metadata> {
  const { locale } = await props.params;

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.inviteToken",
  });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function Page({ params }: InviteTokenPageProps) {
  await connection();

  const { locale, token } = await params;
  const appLocale = locale as AppLocale;

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

  const session = sessionResponse.ok ? sessionResponse.data.session : null;

  if (!session) {
    const validationResponse = await validateInviteToken(token);

    if (!validationResponse.ok) {
      return (
        <InviteStatePanel
          state="error"
          title={t("states.error.title")}
          description={t("states.error.description")}
          action={
            <Button
              size="lg"
              nativeButton={false}
              className="w-full"
              render={<Link href={getInviteHref(token)} />}
            >
              {t("states.error.cta")}
            </Button>
          }
        />
      );
    }

    if (!validationResponse.data.isValid) {
      return (
        <InviteStatePanel
          state="blocked"
          title={t("states.blocked.title")}
          description={t("states.blocked.description")}
          action={
            <Button
              size="lg"
              nativeButton={false}
              className="w-full"
              render={<Link href={SIGN_IN_PATH} />}
            >
              {tCommonError("goToSignIn")}
            </Button>
          }
        />
      );
    }

    redirect({
      href: getInviteStartHref(token),
      locale: locale as Locale,
    });
    return null;
  }

  const inspectResponse = await getInviteTokenForUser(token, {
    id: session.user.id,
    email: session.user.email,
  });
  const applicationEntryHref = await resolveApplicationEntryHref(session.user.id);
  const acceptAction = getPathname({
    href: getInviteAcceptHref(token),
    locale: appLocale,
  });

  if (!inspectResponse.ok) {
    return (
      <InviteStatePanel
        state="error"
        title={t("states.error.title")}
        description={t("states.error.description")}
        action={
          <Button
            size="lg"
            nativeButton={false}
            className="w-full"
            render={<Link href={getInviteHref(token)} />}
          >
            {t("states.error.cta")}
          </Button>
        }
      />
    );
  }

  if (inspectResponse.data.result.state === "already_member") {
    redirect({
      href: getInviteAcceptHref(token),
      locale: locale as Locale,
    });
  }

  if (inspectResponse.data.result.state === "pending") {
    return (
      <InviteStatePanel
        state="pending"
        workspace={inspectResponse.data.result.workspace}
        title={t("states.pending.title")}
        description={
          <>
            <p>
              {t.rich("states.pending.description", {
                workspace: inspectResponse.data.result.workspace.name,
                strong: (chunks) => (
                  <strong className="text-foreground font-medium">{chunks}</strong>
                ),
              })}
            </p>
          </>
        }
        action={
          <form action={acceptAction} method="post">
            <Button type="submit" size="lg" className="w-full">
              {t("actions.continueAs", {
                email: session.user.email,
              })}
            </Button>
          </form>
        }
      />
    );
  }

  if (inspectResponse.data.result.state === "email_mismatch") {
    return (
      <InviteStatePanel
        state="email_mismatch"
        title={t("states.email_mismatch.title")}
        description={
          <>
            <p>{t("states.email_mismatch.description")}</p>
            <p>{t("states.email_mismatch.secondary")}</p>
            <p>
              {t.rich("states.email_mismatch.currentEmail", {
                email: session.user.email,
                strong: renderStrong,
              })}
            </p>
          </>
        }
        action={
          <InviteSignOutButton
            label={t("states.email_mismatch.cta")}
            errorMessage={t("actions.signOutError")}
            redirectHref={getInviteHref(token)}
          />
        }
      />
    );
  }

  return (
    <InviteStatePanel
      state="blocked"
      title={t("states.blocked.title")}
      description={t("states.blocked.description")}
      action={
        <Button
          size="lg"
          nativeButton={false}
          className="w-full"
          render={<Link href={applicationEntryHref} />}
        >
          {tCommonError("goToApp")}
        </Button>
      }
    />
  );
}

function renderStrong(chunks: React.ReactNode) {
  return <strong className="text-foreground font-medium">{chunks}</strong>;
}
