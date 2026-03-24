import { Locale } from "next-intl";
import { redirect } from "@/i18n/navigation";

export default async function Page({ params }: PageProps<"/[locale]/settings">) {
  const { locale } = await params;

  redirect({
    href: "/settings/profile",
    locale: locale as Locale,
  });
}
