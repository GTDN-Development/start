import { Locale } from "next-intl";
import { redirect } from "@/i18n/navigation";
import { APP_HOME_PATH, getInviteHref, getWorkspaceOverviewHref } from "@/config/routes";
import { applyServerAuthCookies } from "@/server/auth/auth-cookies";
import { getServerAuthSession } from "@/server/auth/auth-session-service";
import { setActiveWorkspaceSlugCookie } from "@/server/workspaces/workspace-cookie";
import { resolvePostAuthDestination } from "@/server/workspaces/workspace-resolution-service";

type AuthGuestLayoutProps = {
  children: React.ReactNode;
  params: Promise<{
    locale: string;
  }>;
};

export default async function Layout({ children, params }: AuthGuestLayoutProps) {
  const { locale } = await params;
  const sessionResponse = await getServerAuthSession();

  await applyServerAuthCookies(sessionResponse.setCookie);

  if (sessionResponse.ok && sessionResponse.data.session) {
    const destinationResponse = await resolvePostAuthDestination({
      userId: sessionResponse.data.session.user.id,
      userEmail: sessionResponse.data.session.user.email,
    });

    await applyServerAuthCookies(destinationResponse.setCookie);

    if (destinationResponse.ok) {
      if (destinationResponse.data.state === "workspace_redirect") {
        await setActiveWorkspaceSlugCookie(destinationResponse.data.workspaceSlug);

        redirect({
          href: getWorkspaceOverviewHref(destinationResponse.data.workspaceSlug),
          locale: locale as Locale,
        });

        return null;
      }

      if (destinationResponse.data.state === "invite_redirect") {
        redirect({
          href: getInviteHref(destinationResponse.data.inviteToken),
          locale: locale as Locale,
        });

        return null;
      }
    }

    redirect({
      href: APP_HOME_PATH,
      locale: locale as Locale,
    });

    return null;
  }

  return children;
}
