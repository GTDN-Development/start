import { type AppHref, getPathname } from "@/i18n/navigation";
import { type Locale } from "next-intl";
// eslint-disable-next-line no-restricted-imports -- Shell-safe localized links render a pre-resolved href without next-intl runtime access.
import NextLink from "next/link";
import { type ComponentPropsWithRef } from "react";

export type LocalizedNavLinkProps = Omit<ComponentPropsWithRef<typeof NextLink>, "href"> & {
  href: AppHref;
  locale: Locale;
};

export function LocalizedNavLink({ href, locale, ref, ...props }: LocalizedNavLinkProps) {
  return <NextLink {...props} ref={ref} href={getPathname({ href, locale })} />;
}
