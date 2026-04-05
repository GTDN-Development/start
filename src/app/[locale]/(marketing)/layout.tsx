import { MarketingLayout } from "@/features/marketing/marketing-layout";
import { APP_HOME_PATH } from "@/config/routes";
import { resolveApplicationEntryHref } from "@/server/application/application-entry-href";
import { getServerAuthSession } from "@/server/auth/auth-session-service";

type MarketingRouteLayoutProps = {
  children: React.ReactNode;
};

export default async function Layout({ children }: MarketingRouteLayoutProps) {
  const sessionResponse = await getServerAuthSession();

  const sessionUser = sessionResponse.ok ? (sessionResponse.data.session?.user ?? null) : null;
  const viewer = sessionUser
    ? {
        id: sessionUser.id,
        email: sessionUser.email,
        name: sessionUser.name,
        avatarUrl: sessionUser.avatarUrl,
      }
    : null;
  const applicationEntryHref = sessionUser
    ? await resolveApplicationEntryHref(sessionUser.id)
    : APP_HOME_PATH;

  return (
    <MarketingLayout viewer={viewer} applicationEntryHref={applicationEntryHref}>
      {children}
    </MarketingLayout>
  );
}
