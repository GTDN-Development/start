import type { AppHref } from "@/i18n/navigation";
import type { InnerSidebarNavItem } from "./inner-sidebar-types";

export type InnerSidebarItemDefinition<TLabelKey extends string> = Omit<
  InnerSidebarNavItem,
  "label"
> & {
  labelKey: TLabelKey;
};

export type OrganizationInnerSidebarItemDefinition<
  TLabelKey extends string,
  TPathname extends string = string,
> = Omit<InnerSidebarItemDefinition<TLabelKey>, "href"> & {
  href: TPathname;
};

type OrganizationSidebarHref<TPathname extends string> = Extract<
  AppHref,
  {
    pathname: TPathname;
    params: {
      organizationSlug: string;
    };
  }
>;

export function mapInnerSidebarItems<TLabelKey extends string>(
  items: ReadonlyArray<InnerSidebarItemDefinition<TLabelKey>>,
  getLabel: (labelKey: TLabelKey) => string
): InnerSidebarNavItem[] {
  return items.map(({ labelKey, ...item }) => ({
    ...item,
    label: getLabel(labelKey),
  }));
}

export function mapOrganizationInnerSidebarItems<
  TLabelKey extends string,
  TPathname extends string,
>(
  items: ReadonlyArray<OrganizationInnerSidebarItemDefinition<TLabelKey, TPathname>>,
  organizationSlug: string,
  getLabel: (labelKey: TLabelKey) => string
): InnerSidebarNavItem[] {
  return items.map(({ labelKey, href, ...item }) => ({
    ...item,
    href: {
      pathname: href,
      params: {
        organizationSlug,
      },
    } as OrganizationSidebarHref<TPathname>,
    activePathnames: [href, ...(item.activePathnames ?? [])],
    label: getLabel(labelKey),
  }));
}
