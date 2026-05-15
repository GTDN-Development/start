import { product } from "@/config/product";
import { getInviteHref } from "@/config/routes";
import { getPathname } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";

export function createOrganizationInviteUrl(inviteToken: string, locale: AppLocale): string {
  const pathname = getPathname({
    href: getInviteHref(inviteToken),
    locale,
  });

  const baseUrl = product.site.url.replace(/\/+$/g, "");

  return `${baseUrl}${pathname}`;
}
