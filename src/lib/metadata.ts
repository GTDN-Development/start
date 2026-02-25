import type { Metadata } from "next";
import defaultOgImage from "@/assets/images/og-image.jpg";
import { site } from "@/config/site";

type SocialPreviewImage = {
  url: string;
  width?: number;
  height?: number;
  alt?: string;
};

type CreatePageMetadataInput = {
  title: string;
  description: string;
  pathname: string;
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
  title,
  description,
  pathname,
  robots,
  socialImage = defaultSocialPreviewImage,
}: CreatePageMetadataInput): Metadata {
  return {
    title,
    description,
    alternates: {
      canonical: pathname,
    },
    openGraph: {
      type: "website",
      siteName: site.name,
      title,
      description,
      url: pathname,
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
