import type { Metadata } from "next";
import type { Locale } from "next-intl";
import defaultOgImage from "@/assets/images/og-image.jpg";
import { site } from "@/config/site";
import { getPathname, type AppPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

type SocialPreviewImage = {
  url: string;
  width?: number;
  height?: number;
  alt?: string;
};

type CreatePageMetadataInput = {
  locale: Locale;
  title: string;
  description: string;
  pathname: AppPathname;
  robots?: Metadata["robots"];
  // For route-specific generated OG images, add `opengraph-image.tsx` in that route segment.
  // This field is for static per-page overrides when needed.
  socialImage?: SocialPreviewImage;
};

export const defaultSocialPreviewImage = {
  url: defaultOgImage.src,
  width: defaultOgImage.width,
  height: defaultOgImage.height,
  alt: site.defaultTitle,
};

export function createPageMetadata({
  locale,
  title,
  description,
  pathname,
  robots,
  socialImage = defaultSocialPreviewImage,
}: CreatePageMetadataInput): Metadata {
  const localizedPathname = getPathname({ href: pathname, locale });

  return {
    title,
    description,
    alternates: getLocalizedAlternates(pathname, locale),
    openGraph: {
      type: "website",
      siteName: site.name,
      title,
      description,
      url: localizedPathname,
      images: [socialImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [socialImage.url],
    },
    ...(robots ? { robots } : {}),
  };
}

export function getLocalizedAlternates(pathname: AppPathname, locale: Locale): Metadata["alternates"] {
  const languages = Object.fromEntries(
    routing.locales.map((item) => [item, getPathname({ href: pathname, locale: item })])
  );

  return {
    canonical: getPathname({ href: pathname, locale }),
    languages,
  };
}
