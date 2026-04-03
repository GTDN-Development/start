import type { AppHref } from "@/i18n/navigation";
import type { InnerSidebarNavItem } from "./inner-sidebar-types";

export type InnerSidebarItemDefinition<TLabelKey extends string> = Omit<
  InnerSidebarNavItem,
  "label"
> & {
  labelKey: TLabelKey;
};

export type WorkspaceInnerSidebarItemDefinition<
  TLabelKey extends string,
  TPathname extends string = string,
> = Omit<InnerSidebarItemDefinition<TLabelKey>, "href"> & {
  href: TPathname;
};

type WorkspaceSidebarHref<TPathname extends string> = Extract<
  AppHref,
  {
    pathname: TPathname;
    params: {
      workspaceSlug: string;
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

export function mapWorkspaceInnerSidebarItems<TLabelKey extends string, TPathname extends string>(
  items: ReadonlyArray<WorkspaceInnerSidebarItemDefinition<TLabelKey, TPathname>>,
  workspaceSlug: string,
  getLabel: (labelKey: TLabelKey) => string
): InnerSidebarNavItem[] {
  return items.map(({ labelKey, href, ...item }) => ({
    ...item,
    href: {
      pathname: href,
      params: {
        workspaceSlug,
      },
    } as WorkspaceSidebarHref<TPathname>,
    activePathnames: [href, ...(item.activePathnames ?? [])],
    label: getLabel(labelKey),
  }));
}
