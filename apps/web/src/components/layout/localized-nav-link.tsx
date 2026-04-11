import { type AppHref, getPathname } from "@/i18n/navigation";
import { type Locale } from "next-intl";
// eslint-disable-next-line no-restricted-imports -- Shell-safe localized links render a pre-resolved href without next-intl runtime access.
import NextLink from "next/link";
import { type ComponentProps } from "react";

export type LocalizedNavLinkProps = Omit<ComponentProps<typeof NextLink>, "href"> & {
  href: AppHref;
  locale: Locale;
};

export function LocalizedNavLink({ href, locale, ...props }: LocalizedNavLinkProps) {
  return <NextLink {...props} href={getPathname({ href, locale })} />;
}
