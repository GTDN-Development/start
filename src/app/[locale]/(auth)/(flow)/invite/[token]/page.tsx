import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { InviteTokenStaticPage } from "@/features/auth/invite/token/invite-token-static-page";

type InviteTokenPageProps = {
  params: Promise<{
    locale: string;
    token: string;
  }>;
};

export async function generateMetadata(props: InviteTokenPageProps): Promise<Metadata> {
  const { locale } = await props.params;

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.inviteToken",
  });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function Page({ params }: InviteTokenPageProps) {
  const { locale } = await params;

  setRequestLocale(locale as Locale);

  return <InviteTokenStaticPage />;
}
