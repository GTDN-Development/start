import { Link as NextIntlLink } from "@/i18n/navigation";
import { ComponentProps } from "react";

export type LinkProps = ComponentProps<typeof NextIntlLink>;

export function Link(props: LinkProps) {
  return <NextIntlLink {...props} />;
}
