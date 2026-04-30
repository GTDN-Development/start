import { Suspense } from "react";
import { Locale } from "next-intl";
import { POST_AUTH_PATH } from "@/config/routes";
import { redirect } from "@/i18n/navigation";
import { getServerAuthSession } from "@/server/auth/auth-session-service";

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

async function AuthGuestLayoutBoundary({ children, params }: AuthGuestLayoutProps) {
  const { locale } = await params;
  const sessionResponse = await getServerAuthSession();

  if (sessionResponse.ok && sessionResponse.data.session) {
    redirect({
      href: POST_AUTH_PATH,
      locale: locale as Locale,
    });

    return null;
  }

  return children;
}
