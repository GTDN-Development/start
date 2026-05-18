import { MetadataRoute } from "next";
import { connection } from "next/server";
import { legalLinks } from "@/config/menu";
import { product } from "@/config/product";
import {
  ACCOUNT_PATH,
  APP_HOME_PATH,
  CONFIRM_EMAIL_CHANGE_PATH,
  FORGOT_PASSWORD_PATH,
  RESET_PASSWORD_PATH,
  SIGN_IN_PATH,
  SIGN_UP_PATH,
  VERIFY_EMAIL_PATH,
} from "@/config/routes";
import { type AppHref, type AppPathname, getPathname } from "@/i18n/navigation";
import { routing, type AppLocale } from "@/i18n/routing";
import { getAllPosts } from "@/server/blog/blog-api";

const excludedSitemapRoutes = new Set<AppPathname>([
  ACCOUNT_PATH,
  APP_HOME_PATH,
  CONFIRM_EMAIL_CHANGE_PATH,
  legalLinks.cookies.href,
  FORGOT_PASSWORD_PATH,
  legalLinks.gdpr.href,
  RESET_PASSWORD_PATH,
  SIGN_IN_PATH,
  SIGN_UP_PATH,
  legalLinks.termsOfService.href,
  VERIFY_EMAIL_PATH,
]);

function getAbsoluteUrl(href: AppHref, locale: AppLocale) {
  return `${product.site.url}${getPathname({ href, locale })}`;
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
  await connection();

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
