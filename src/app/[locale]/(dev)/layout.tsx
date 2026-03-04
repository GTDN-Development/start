import type { Metadata } from "next";
import { ApplicationLayout } from "@/features/application/new/application-layout";

type ApplicationRouteLayoutProps = {
  children: React.ReactNode;
};

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function Layout({ children }: ApplicationRouteLayoutProps) {
  return <ApplicationLayout>{children}</ApplicationLayout>;
}
