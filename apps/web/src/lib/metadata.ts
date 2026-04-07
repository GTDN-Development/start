import type { Metadata } from "next";
import type { Locale } from "next-intl";
import defaultOgImage from "@/assets/images/og-image.jpg";
import { app } from "@/config/app";
import { getPathname, type AppHref } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

type SocialPreviewImage = {
  url: string;
  width?: number;
  height?: number;
  alt?: string;
};

type CreatePublicPageMetadataInput = {
  locale: Locale;
  title: string;
  description: string;
  pathname: AppHref;
  // For route-specific generated OG images, add `opengraph-image.tsx` in that route segment.
  // This field is for static per-page overrides when needed.
  socialImage?: SocialPreviewImage;
};

export const defaultSocialPreviewImage = {
  url: defaultOgImage.src,
  width: defaultOgImage.width,
  height: defaultOgImage.height,
  alt: app.site.defaultTitle,
};

export function createPublicPageMetadata({
  locale,
  title,
  description,
  pathname,
  socialImage = defaultSocialPreviewImage,
}: CreatePublicPageMetadataInput): Metadata {
  const localizedPathname = getPathname({ href: pathname, locale });

  return {
    title,
    description,
    alternates: getLocalizedAlternates(pathname, locale),
    openGraph: {
      type: "website",
      siteName: app.site.name,
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
  };
}

export function getLocalizedAlternates(pathname: AppHref, locale: Locale): Metadata["alternates"] {
  const languages = Object.fromEntries(
    routing.locales.map((item) => [item, getPathname({ href: pathname, locale: item })])
  );

  return {
    canonical: getPathname({ href: pathname, locale }),
    languages,
  };
}
