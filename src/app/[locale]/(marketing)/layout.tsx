import { MarketingLayout } from "@/features/marketing/marketing-layout";
import { resolveApplicationEntryHref } from "@/features/application/application-entry";
import { getServerAuthSession } from "@/server/auth/auth-service";

type MarketingRouteLayoutProps = {
  children: React.ReactNode;
};

export default async function Layout({ children }: MarketingRouteLayoutProps) {
  const sessionResponse = await getServerAuthSession();
  const sessionUser = sessionResponse.ok ? sessionResponse.data.session?.user ?? null : null;
  const viewer = sessionUser
    ? {
        id: sessionUser.id,
        email: sessionUser.email,
        name: sessionUser.name,
        verified: sessionUser.verified,
        avatarUrl: sessionUser.avatarUrl,
      }
    : null;
  const applicationEntryHref = sessionUser
    ? await resolveApplicationEntryHref(sessionUser.id)
    : "/app";

  return (
    <MarketingLayout viewer={viewer} applicationEntryHref={applicationEntryHref}>
      {children}
    </MarketingLayout>
  );
}
