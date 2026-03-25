import { app } from "@/config/app";
import { getInviteHref } from "@/config/routes";
import { getPathname } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";

export function createWorkspaceInviteUrl(inviteToken: string, locale: AppLocale): string {
  const pathname = getPathname({
    href: getInviteHref(inviteToken),
    locale,
  });

  const baseUrl = app.site.url.replace(/\/+$/g, "");

  return `${baseUrl}${pathname}`;
}
