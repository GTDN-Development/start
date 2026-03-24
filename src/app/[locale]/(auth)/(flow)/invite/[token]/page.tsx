import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/components/ui/link";
import { Button } from "@/components/ui/button";
import { SIGN_IN_PATH, getWorkspaceOverviewHref } from "@/config/routes";
import { resolveApplicationEntryHref } from "@/features/application/application-entry";
import { type AppHref, redirect } from "@/i18n/navigation";
import { createPageMetadata } from "@/lib/metadata";
import { applyServerAuthCookies } from "@/server/auth/auth-cookies";
import { getServerAuthSession } from "@/server/auth/auth-service";
import { setActiveWorkspaceSlugCookie } from "@/server/workspaces/workspace-cookie";
import {
  getInviteTokenForUser,
  validateInviteToken,
} from "@/server/workspaces/workspace-invite-service";
import { InviteSignOutButton } from "../invite-sign-out-button";
import { InviteStatePanel } from "../invite-state-panel";

type InviteTokenPageProps = {
  params: Promise<{
    locale: string;
    token: string;
  }>;
};

export async function generateMetadata(props: InviteTokenPageProps): Promise<Metadata> {
  const { locale, token } = await props.params;

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.inviteToken",
  });

  return createPageMetadata({
    title: t("title"),
    description: t("description"),
    locale: locale as Locale,
    pathname: {
      pathname: "/invite/[token]",
      params: {
        token,
      },
    },
  });
}

export default async function Page({ params }: InviteTokenPageProps) {
  const { locale, token } = await params;

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

  if (!session) {
    const validationResponse = await validateInviteToken(token);

    if (!validationResponse.ok) {
      return (
        <InviteStatePanel
          title={t("states.error.title")}
          description={t("states.error.description")}
          action={renderInviteLinkAction(t("states.error.cta"), {
            pathname: "/invite/[token]",
            params: {
              token,
            },
          })}
        />
      );
    }

    if (!validationResponse.data.isValid) {
      return (
        <InviteStatePanel
          title={t("states.blocked.title")}
          description={t("states.blocked.description")}
          action={renderInviteLinkAction(tCommonError("goToSignIn"), SIGN_IN_PATH)}
        />
      );
    }

    redirect({
      href: {
        pathname: "/invite/[token]/start",
        params: {
          token,
        },
      },
      locale: locale as Locale,
    });
    return null;
  }

  const inspectResponse = await getInviteTokenForUser(token, {
    id: session.user.id,
    email: session.user.email,
  });
  const applicationEntryHref = await resolveApplicationEntryHref(session.user.id);

  if (!inspectResponse.ok) {
    return (
      <InviteStatePanel
        title={t("states.error.title")}
        description={t("states.error.description")}
        action={renderInviteLinkAction(tCommonError("goToApp"), applicationEntryHref)}
      />
    );
  }

  if (inspectResponse.data.result.state === "already_member") {
    await setActiveWorkspaceSlugCookie(inspectResponse.data.result.workspace.slug);

    redirect({
      href: getWorkspaceOverviewHref(inspectResponse.data.result.workspace.slug),
      locale: locale as Locale,
    });
  }

  if (inspectResponse.data.result.state === "pending") {
    return (
      <InviteStatePanel
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
            <p>
              {t.rich("shared.continueAs", {
                email: session.user.email,
                strong: (chunks) => (
                  <strong className="text-foreground font-medium">{chunks}</strong>
                ),
              })}
            </p>
          </>
        }
        action={renderInviteAcceptAction(t("actions.accept"))}
      />
    );
  }

  if (inspectResponse.data.result.state === "email_mismatch") {
    return (
      <InviteStatePanel
        title={t("states.email_mismatch.title")}
        description={
          <>
            <p>{t("states.email_mismatch.description")}</p>
            <p>
              {t.rich("states.email_mismatch.secondary", {
                invitedEmail: inspectResponse.data.result.invitedEmail,
                currentEmail: inspectResponse.data.result.currentEmail,
                strong: (chunks) => (
                  <strong className="text-foreground font-medium">{chunks}</strong>
                ),
              })}
            </p>
          </>
        }
        action={
          <InviteSignOutButton
            label={t("states.email_mismatch.cta")}
            errorMessage={t("actions.signOutError")}
            redirectHref={{
              pathname: "/invite/[token]",
              params: {
                token,
              },
            }}
          />
        }
      />
    );
  }

  return (
    <InviteStatePanel
      title={t("states.blocked.title")}
      description={t("states.blocked.description")}
      action={renderInviteLinkAction(tCommonError("goToApp"), applicationEntryHref)}
    />
  );
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

function renderInviteAcceptAction(label: string) {
  return (
    <form action="accept" method="post">
      <Button type="submit" size="lg" className="w-full">
        {label}
      </Button>
    </form>
  );
}
