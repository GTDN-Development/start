import { Suspense } from "react";
import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { LoadingState } from "@/components/ui/loading-state";
import { ApplicationLayout } from "@/features/application/application-layout";
import { ApplicationShellBoundary } from "@/features/application/application-shell-boundary";

type ApplicationRouteLayoutProps = {
  children: React.ReactNode;
  params: Promise<{
    locale: string;
  }>;
};

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function Layout({ children, params }: ApplicationRouteLayoutProps) {
  return (
    <Suspense fallback={<ApplicationRouteLoading />}>
      <ApplicationShellBoundary params={params}>{children}</ApplicationShellBoundary>
    </Suspense>
  );
}

function ApplicationRouteLoading() {
  return (
    <ApplicationLayout>
      <Container size="xl" className="h-full pt-10 pb-24">
        <LoadingState className="h-full min-h-96" />
      </Container>
    </ApplicationLayout>
  );
}
