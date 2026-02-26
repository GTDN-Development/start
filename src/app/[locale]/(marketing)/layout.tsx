import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { createServerPocketBaseClient } from "@/server/pocketbase/server";

type MarketingRouteLayoutProps = {
  children: React.ReactNode;
};

export default async function Layout({ children }: MarketingRouteLayoutProps) {
  const pb = await createServerPocketBaseClient();
  const viewer = getMarketingViewer(pb.authStore.record);

  return <MarketingLayout viewer={viewer}>{children}</MarketingLayout>;
}

function getMarketingViewer(record: unknown) {
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
