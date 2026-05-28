import type { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { LayoutBanners } from "@/components/layout/layout-banners";
import {
  getActiveLayoutBanner,
  type LayoutBannerArea,
} from "@/server/layout-banners/layout-banner-service";

type LayoutBannerSlotProps = {
  area: LayoutBannerArea;
  locale: Locale;
};

export async function LayoutBannerSlot({ area, locale }: LayoutBannerSlotProps) {
  const [layoutBanner, tLayoutBanner] = await Promise.all([
    getActiveLayoutBanner({
      area,
      locale,
    }),
    getTranslations({
      locale,
      namespace: "layout.banner",
    }),
  ]);

  if (!layoutBanner) {
    return null;
  }

  return (
    <LayoutBanners
      banner={layoutBanner}
      labels={{
        dismiss: tLayoutBanner("close"),
      }}
    />
  );
}
