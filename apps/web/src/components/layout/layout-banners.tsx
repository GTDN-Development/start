export type LayoutBannerItem = {
  isVisible: boolean;
  content: React.ReactNode;
};

type LayoutBannersProps = {
  banners: LayoutBannerItem[];
};

export function LayoutBanners({ banners }: LayoutBannersProps) {
  const activeBanner = banners.find((banner) => banner.isVisible);

  if (!activeBanner) {
    return null;
  }

  return <>{activeBanner.content}</>;
}
