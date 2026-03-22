import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/components/ui/link";
import { Button } from "@/components/ui/button";
import { redirect } from "@/i18n/navigation";
import { createPageMetadata } from "@/lib/metadata";
import { getServerAuthSession } from "@/server/auth/auth-service";
import {
  acceptInviteTokenForUser,
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
  const session = sessionResponse.ok ? sessionResponse.data.session : null;

  const validationResponse = await validateInviteToken(token);

  if (!validationResponse.ok || !validationResponse.data.isValid) {
    return (
      <InviteStatePanel
        title={t("states.blocked.title")}
        description={t("states.blocked.description")}
        action={renderInviteLinkAction(
          session ? tCommonError("goToOverview") : tCommonError("goToSignIn"),
          session ? "/overview" : "/sign-in"
        )}
      />
    );
  }

  if (!session) {
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

  const acceptResponse = await acceptInviteTokenForUser(token, {
    id: session.user.id,
    email: session.user.email,
  });

  if (!acceptResponse.ok) {
    return (
      <InviteStatePanel
        title={t("states.error.title")}
        description={t("states.error.description")}
        action={renderInviteLinkAction(tCommonError("goToOverview"), "/overview")}
      />
    );
  }

  if (
    acceptResponse.data.result.state === "accepted" ||
    acceptResponse.data.result.state === "already_member"
  ) {
    redirect({
      href: {
        pathname: "/w/[workspaceSlug]/overview",
        params: {
          workspaceSlug: acceptResponse.data.result.workspace.slug,
        },
      },
      locale: locale as Locale,
    });
  }

  if (acceptResponse.data.result.state === "email_mismatch") {
    return (
      <InviteStatePanel
        title={t("states.email_mismatch.title")}
        description={
          <>
            <p>{t("states.email_mismatch.description")}</p>
            <p>
              {t.rich("states.email_mismatch.secondary", {
                invitedEmail: acceptResponse.data.result.invitedEmail,
                currentEmail: acceptResponse.data.result.currentEmail,
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
      action={renderInviteLinkAction(tCommonError("goToOverview"), "/overview")}
    />
  );
}

function renderInviteLinkAction(label: string, href: "/overview" | "/sign-in") {
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
