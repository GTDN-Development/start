import { Locale } from "next-intl";
import { redirect } from "@/i18n/navigation";

export default async function Page({
  params,
}: PageProps<"/[locale]/w/[workspaceSlug]/settings">) {
  const { locale, workspaceSlug } = await params;

  redirect({
    href: {
      pathname: "/w/[workspaceSlug]/settings/general",
      params: {
        workspaceSlug,
      },
    },
    locale: locale as Locale,
  });
}
