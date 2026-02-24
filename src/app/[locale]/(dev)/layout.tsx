import { MarketingLayout } from "@/components/layouts/marketing/marketing-layout";
import { notFound } from "next/navigation";

export default function DevLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return <MarketingLayout viewer={null}>{children}</MarketingLayout>;
}
