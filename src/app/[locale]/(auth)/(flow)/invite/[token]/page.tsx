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

  const validationResponse = await validateInviteToken(token);

  if (!validationResponse.ok || !validationResponse.data.isValid) {
    return (
      <InvitePageState
        title={t("states.blocked.title")}
        description={t("states.blocked.description")}
        actionLabel={t("states.already_member.cta")}
        actionHref="/sign-in"
      />
    );
  }

  const sessionResponse = await getServerAuthSession();
  const session = sessionResponse.ok ? sessionResponse.data.session : null;

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
      <InvitePageState
        title={t("states.error.title")}
        description={t("states.error.description")}
        actionLabel={t("states.already_member.cta")}
        actionHref="/overview"
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
      <InvitePageState
        title={t("states.email_mismatch.title")}
        description={t("states.email_mismatch.secondary", {
          invitedEmail: acceptResponse.data.result.invitedEmail,
          currentEmail: acceptResponse.data.result.currentEmail,
        })}
        actionLabel={t("states.email_mismatch.cta")}
        actionHref="/sign-in"
      />
    );
  }

  return (
    <InvitePageState
      title={t("states.blocked.title")}
      description={t("states.blocked.description")}
      actionLabel={t("states.already_member.cta")}
      actionHref="/overview"
    />
  );
}

function InvitePageState({
  title,
  description,
  actionLabel,
  actionHref,
}: {
  title: string;
  description: string;
  actionLabel: string;
  actionHref: "/sign-in" | "/overview";
}) {
  return (
    <div className="mx-auto flex min-h-[40vh] w-full max-w-md flex-col justify-center py-8 text-center">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="text-muted-foreground mt-3 text-sm">{description}</p>
      <Button
        size="lg"
        nativeButton={false}
        className="mt-6 w-full"
        render={<Link href={actionHref} className="w-full" />}
      >
        {actionLabel}
      </Button>
    </div>
  );
}
