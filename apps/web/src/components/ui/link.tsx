"use client";

import { Link as AppLink } from "@/i18n/navigation";
// eslint-disable-next-line no-restricted-imports -- This wrapper centralizes the only direct Next.js Link usage.
import NextLink from "next/link";
import { ComponentProps, ComponentPropsWithoutRef } from "react";

type AppLinkProps = ComponentProps<typeof AppLink>;
type ExternalHref = `#${string}` | `http${string}` | `mailto:${string}` | `tel:${string}`;
type ExternalLinkProps = Omit<ComponentPropsWithoutRef<"a">, "href"> & {
  href: ExternalHref;
};
type LocalizedPathLinkProps = Omit<ComponentProps<typeof NextLink>, "href"> & {
  href: string;
};

export { Link } from "@/i18n/navigation";

export type LinkHref = AppLinkProps["href"];
export type LinkProps = AppLinkProps | ExternalLinkProps;

export function LocalizedPathLink({ href, ...props }: LocalizedPathLinkProps) {
  return <NextLink href={href} {...props} />;
}
