import { Link as AppLink } from "@/i18n/navigation";
import { ComponentProps, ComponentPropsWithoutRef } from "react";

type AppLinkProps = ComponentProps<typeof AppLink>;
type ExternalHref = `#${string}` | `http${string}` | `mailto:${string}` | `tel:${string}`;
type ExternalLinkProps = Omit<ComponentPropsWithoutRef<"a">, "href"> & {
  href: ExternalHref;
};

export { Link } from "@/i18n/navigation";

export type LinkHref = AppLinkProps["href"];
export type LinkProps = AppLinkProps | ExternalLinkProps;
