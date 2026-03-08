"use client";

import { NavLink } from "@/components/layout/nav-link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type AppPathname, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import {
  ChevronDownIcon,
  ShieldIcon,
  SlidersHorizontalIcon,
  UserIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";
import { useMemo } from "react";

export type InnerSidebarIconKey = "user" | "shield" | "sliders" | "users";

export type InnerSidebarNavItem = {
  href: AppPathname;
  label: string;
  icon: InnerSidebarIconKey;
  matchNested?: boolean;
  activePathnames?: AppPathname[];
  activePathPrefixes?: string[];
};

type InnerSidebarLayoutProps = {
  children: React.ReactNode;
  title: string;
  items: InnerSidebarNavItem[];
  className?: string;
};

type InnerSidebarMobileNavProps = {
  className?: string;
  title: string;
  items: InnerSidebarNavItem[];
};

type RenderableInnerSidebarNavItem = Omit<InnerSidebarNavItem, "icon"> & {
  icon: LucideIcon;
};

const INNER_SIDEBAR_ICONS: Record<InnerSidebarIconKey, LucideIcon> = {
  user: UserIcon,
  shield: ShieldIcon,
  sliders: SlidersHorizontalIcon,
  users: UsersIcon,
};

function InnerSidebarMobileNav({ className, title, items }: InnerSidebarMobileNavProps) {
  const pathname = usePathname();
  const renderableItems = useMemo(() => createRenderableItems(items), [items]);
  const currentItem = useMemo(
    () => getCurrentInnerSidebarNavItem(pathname, renderableItems),
    [pathname, renderableItems]
  );

  return (
    <nav className={className} aria-label={title}>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              className="border-border bg-background text-foreground focus-visible:border-ring focus-visible:ring-ring/50 hover:bg-accent/50 flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm font-medium transition-colors outline-none focus-visible:ring-3"
              aria-label={title}
            />
          }
        >
          {currentItem ? <currentItem.icon aria-hidden="true" className="size-4 shrink-0" /> : null}
          {currentItem ? currentItem.label : title}
          <ChevronDownIcon aria-hidden="true" className="ml-auto size-4 shrink-0" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" sideOffset={8} className="space-y-1">
          {renderableItems.map((item) => {
            return (
              <DropdownMenuItem
                key={item.href}
                render={
                  <NavLink
                    href={item.href}
                    matchNested={item.matchNested}
                    className="data-current:bg-accent data-current:text-accent-foreground flex w-full cursor-pointer items-center gap-2 py-1.5 whitespace-nowrap"
                  />
                }
              >
                <item.icon aria-hidden="true" />
                {item.label}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
}

export function InnerSidebarLayout({ children, title, items, className }: InnerSidebarLayoutProps) {
  const pathname = usePathname();
  const renderableItems = useMemo(() => createRenderableItems(items), [items]);

  return (
    <div className={cn("@container/inner-sidebar", className)}>
      <div className="grid gap-6 @3xl/inner-sidebar:grid-cols-[auto_1fr] @3xl/inner-sidebar:gap-12">
        <InnerSidebarMobileNav className="@3xl/inner-sidebar:hidden" title={title} items={items} />

        {renderableItems.length > 0 && (
          <nav className="relative hidden w-64 @3xl/inner-sidebar:block" aria-label={title}>
            <ul className="sticky top-[calc(var(--navbar-height,64px)+2rem)] flex flex-col gap-1">
              {renderableItems.map((item) => {
                const isActive = isCurrentInnerSidebarNavItem(pathname, item);

                return (
                  <li key={item.href}>
                    <NavLink
                      href={item.href}
                      matchNested={item.matchNested}
                      className={cn(
                        "text-muted-foreground hover:bg-accent/50 hover:text-foreground data-current:bg-accent data-current:text-accent-foreground flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
                        isActive && "bg-accent text-accent-foreground"
                      )}
                    >
                      <item.icon aria-hidden="true" />
                      {item.label}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}

function createRenderableItems(items: InnerSidebarNavItem[]): RenderableInnerSidebarNavItem[] {
  return items.map((item) => ({
    ...item,
    icon: INNER_SIDEBAR_ICONS[item.icon],
  }));
}

function getCurrentInnerSidebarNavItem<T extends Omit<InnerSidebarNavItem, "icon">>(
  pathname: string,
  items: T[]
) {
  if (items.length === 0) {
    return null;
  }

  return items.find((item) => isCurrentInnerSidebarNavItem(pathname, item)) ?? items[0];
}

function isCurrentInnerSidebarNavItem(pathname: string, item: Omit<InnerSidebarNavItem, "icon">) {
  if (item.activePathnames?.includes(pathname as AppPathname)) {
    return true;
  }

  if (
    item.activePathPrefixes?.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    )
  ) {
    return true;
  }

  if (item.matchNested) {
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }

  return pathname === item.href;
}
