import { Locale } from "next-intl";
import { redirect } from "@/i18n/navigation";
import { AUTH_REDIRECTS } from "@/features/auth/auth-routes";
import { getServerAuthSession } from "@/server/auth/auth-service";

type AuthGuestLayoutProps = {
  children: React.ReactNode;
  params: Promise<{
    locale: string;
  }>;
};

export default async function Layout({ children, params }: AuthGuestLayoutProps) {
  const { locale } = await params;
  const sessionResponse = await getServerAuthSession();

  if (sessionResponse.ok && sessionResponse.data.session) {
    redirect({
      href: AUTH_REDIRECTS.authenticatedTo,
      locale: locale as Locale,
    });

    return null;
  }

  return children;
}
