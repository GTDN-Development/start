import NextLink, { type LinkProps as NextLinkProps } from "next/link";

export type LinkProps = NextLinkProps &
  React.ComponentPropsWithoutRef<"a"> & { ref?: React.Ref<HTMLAnchorElement> };

export function Link({ ref, ...props }: LinkProps) {
  return <NextLink {...props} ref={ref} />;
}
