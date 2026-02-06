import { MarketingLayout } from "@/components/layouts/marketing/marketing-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <MarketingLayout>{children}</MarketingLayout>;
}
