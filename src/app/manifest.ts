import { MetadataRoute } from "next";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const t = await getTranslations({
    locale: routing.defaultLocale,
    namespace: "common.manifest",
  });

  return {
    name: t("name"),
    start_url: "/",
    theme_color: "#101E33",
  };
}
