import { Locale } from "next-intl";
import { redirect } from "@/i18n/navigation";
import { POST_AUTH_PATH } from "@/config/routes";
import { getServerAuthSession } from "@/server/auth/auth-session-service";

type AuthGuestLayoutBoundaryProps = {
  children: React.ReactNode;
  params: Promise<{
    locale: string;
  }>;
};

export async function AuthGuestLayoutBoundary({ children, params }: AuthGuestLayoutBoundaryProps) {
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
