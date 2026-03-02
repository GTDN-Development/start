import { MarketingLayout } from "@/features/marketing/marketing-layout";

type MarketingRouteLayoutProps = {
  children: React.ReactNode;
};

export default async function Layout({ children }: MarketingRouteLayoutProps) {
  return <MarketingLayout viewer={null}>{children}</MarketingLayout>;
}
