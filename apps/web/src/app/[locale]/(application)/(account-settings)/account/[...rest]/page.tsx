import { Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

export default async function Page({ params }: PageProps<"/[locale]/account/[...rest]">) {
  const { locale } = await params;

  setRequestLocale(locale as Locale);

  notFound();
}
