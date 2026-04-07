import { cacheLife } from "next/cache";
import { MetadataRoute } from "next";
import { app } from "@/config/app";
import { type AppHref, type AppPathname, getPathname } from "@/i18n/navigation";
import { routing, type AppLocale } from "@/i18n/routing";
import { getAllPosts } from "@/server/blog/blog-api";

const excludedSitemapRoutes = new Set<AppPathname>([
  "/account",
  "/app",
  "/confirm-email-change",
  "/cookies",
  "/forgot-password",
  "/gdpr",
  "/reset-password",
  "/sign-in",
  "/sign-up",
  "/terms-of-service",
  "/verify-email",
]);

function getAbsoluteUrl(href: AppHref, locale: AppLocale) {
  return `${app.site.url}${getPathname({ href, locale })}`;
}

function createAlternates(href: AppHref) {
  return {
    languages: Object.fromEntries(
      routing.locales.map((locale) => [locale, getAbsoluteUrl(href, locale)])
    ),
  };
}

function isStaticPublicRoute(pathname: AppPathname) {
  return !pathname.includes("[") && !excludedSitemapRoutes.has(pathname);
}

function createStaticEntry(
  pathname: AppPathname,
  lastModified: Date
): MetadataRoute.Sitemap[number] {
  return {
    url: getAbsoluteUrl(pathname, routing.defaultLocale),
    lastModified,
    alternates: createAlternates(pathname),
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  "use cache";
  cacheLife("blog");

  const currentDate = new Date();
  const staticRoutes = (Object.keys(routing.pathnames) as AppPathname[]).filter(
    isStaticPublicRoute
  );
  const postsByLocale = await Promise.all(
    routing.locales.map(async (locale) => {
      const posts = await getAllPosts(locale);

      return posts.map((post) => ({
        url: getAbsoluteUrl(
          {
            pathname: "/blog/[slug]",
            params: {
              slug: post.slug,
            },
          },
          locale
        ),
        lastModified: new Date(post.date),
      }));
    })
  );

  return [
    ...staticRoutes.map((pathname) => createStaticEntry(pathname, currentDate)),
    ...postsByLocale.flat(),
  ];
}
