import { Link as NextIntlLink } from "@/i18n/navigation";
import { ComponentProps, ComponentPropsWithoutRef } from "react";

type NextIntlLinkProps = ComponentProps<typeof NextIntlLink>;
type ExternalHref = `#${string}` | `http${string}` | `mailto:${string}` | `tel:${string}`;
type ExternalLinkProps = Omit<ComponentPropsWithoutRef<"a">, "href"> & {
  href: ExternalHref;
};

export type LinkHref = NextIntlLinkProps["href"];
export type LinkProps = NextIntlLinkProps | ExternalLinkProps;

export function Link(props: LinkProps) {
  if (isExternalLinkProps(props)) {
    const { href, ...rest } = props;

    return <a href={href} {...rest} />;
  }

  return <NextIntlLink {...props} />;
}

function isExternalLinkProps(props: LinkProps): props is ExternalLinkProps {
  return typeof props.href === "string" && isExternalHref(props.href);
}

function isExternalHref(href: string): href is ExternalHref {
  return (
    href.startsWith("#") ||
    href.startsWith("http://") ||
    href.startsWith("https://") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:")
  );
}
