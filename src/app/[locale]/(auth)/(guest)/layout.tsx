import { Locale } from "next-intl";
import { redirect } from "@/i18n/navigation";
import { createServerPocketBaseClient } from "@/server/pocketbase/server";

type AuthGuestLayoutProps = {
  children: React.ReactNode;
  params: Promise<{
    locale: string;
  }>;
};

export default async function Layout({ children, params }: AuthGuestLayoutProps) {
  const { locale } = await params;
  const pb = await createServerPocketBaseClient();

  if (pb.authStore.isValid && pb.authStore.record) {
    redirect({ href: "/dashboard", locale: locale as Locale });
  }

  return children;
}
