import { redirect } from "next/navigation";
import { createServerPocketBaseClient } from "@/lib/pocketbase/server";

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
    redirect(`/${locale}/dashboard`);
  }

  return children;
}
