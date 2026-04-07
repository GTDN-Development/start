import { Suspense } from "react";
import { AuthGuestLayoutBoundary } from "@/features/auth/auth-guest-layout-boundary";

type AuthGuestLayoutProps = {
  children: React.ReactNode;
  params: Promise<{
    locale: string;
  }>;
};

export default function Layout({ children, params }: AuthGuestLayoutProps) {
  return (
    <Suspense fallback={null}>
      <AuthGuestLayoutBoundary params={params}>{children}</AuthGuestLayoutBoundary>
    </Suspense>
  );
}
