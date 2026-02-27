import { MarketingLayout } from "@/features/marketing/marketing-layout";
import { getAccountProfileSnapshot } from "@/features/account/account-profile";
import type { UserAccountMenuViewer } from "@/features/account/user-account-menu";
import { createServerPocketBaseClient } from "@/server/pocketbase/pb-client";

type MarketingRouteLayoutProps = {
  children: React.ReactNode;
};

export default async function Layout({ children }: MarketingRouteLayoutProps) {
  const pb = await createServerPocketBaseClient();
  const viewer = getMarketingViewer(pb.authStore.record);

  return <MarketingLayout viewer={viewer}>{children}</MarketingLayout>;
}

function getMarketingViewer(record: unknown): UserAccountMenuViewer | null {
  const profile = getAccountProfileSnapshot(record);

  if (!profile.email) {
    return null;
  }

  return {
    email: profile.email,
    name: profile.name,
    verified: profile.verified,
    avatarUrl: profile.avatarUrl,
  };
}
