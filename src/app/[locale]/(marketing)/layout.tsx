import { MarketingLayout } from "@/features/marketing/marketing-layout";
import { getServerAuthSession } from "@/server/auth/auth-service";

type MarketingRouteLayoutProps = {
  children: React.ReactNode;
};

export default async function Layout({ children }: MarketingRouteLayoutProps) {
  const sessionResponse = await getServerAuthSession();
  const viewer = sessionResponse.ok
    ? sessionResponse.data.session?.user
      ? {
          email: sessionResponse.data.session.user.email,
          name: sessionResponse.data.session.user.name,
          verified: sessionResponse.data.session.user.verified,
          avatarUrl: sessionResponse.data.session.user.avatarUrl,
        }
      : null
    : null;

  return <MarketingLayout viewer={viewer}>{children}</MarketingLayout>;
}
