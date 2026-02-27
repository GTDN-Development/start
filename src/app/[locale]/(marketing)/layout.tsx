import { MarketingLayout } from "@/features/marketing/marketing-layout";
import type { UserAccountMenuViewer } from "@/features/account/user-account-menu";
import { createServerPocketBaseClient } from "@/server/pocketbase/pb-client";

type MarketingRouteLayoutProps = {
  children: React.ReactNode;
};

export default async function Layout({ children }: MarketingRouteLayoutProps) {
  const pb = await createServerPocketBaseClient({ refreshAuth: true });
  const viewer = getMarketingViewer(pb.authStore.record);

  return <MarketingLayout viewer={viewer}>{children}</MarketingLayout>;
}

function getMarketingViewer(record: unknown): UserAccountMenuViewer | null {
  if (typeof record !== "object" || record === null) {
    return null;
  }

  const recordData = record as Record<string, unknown>;
  const email = typeof recordData.email === "string" ? recordData.email : "";

  if (!email) {
    return null;
  }

  return {
    email,
    name: typeof recordData.name === "string" ? recordData.name : null,
    verified: typeof recordData.verified === "boolean" ? recordData.verified : false,
  };
}
