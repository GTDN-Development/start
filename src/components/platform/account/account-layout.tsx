"use client";

import { NavLink } from "@/components/shared/layout/nav-link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePathname } from "@/i18n/navigation";
import { ChevronDownIcon } from "lucide-react";
import { useTranslations } from "next-intl";

type AccountNavItem = {
  href: "/account" | "/account/security";
  labelKey: "general" | "security";
};

const accountNavItems: AccountNavItem[] = [
  { href: "/account", labelKey: "general" },
  { href: "/account/security", labelKey: "security" },
];

function isCurrentAccountNavItem(pathname: string, item: AccountNavItem) {
  const matchNested = item.href !== "/account";

  return matchNested
    ? pathname === item.href || pathname.startsWith(`${item.href}/`)
    : pathname === item.href;
}

function getCurrentAccountNavItem(pathname: string) {
  return (
    accountNavItems.find((item) => isCurrentAccountNavItem(pathname, item)) ?? accountNavItems[0]
  );
}

function AccountMobileNav({ className }: { className: string }) {
  const pathname = usePathname();
  const tAccount = useTranslations("pages.account");
  const tNav = useTranslations("pages.account.nav");
  const currentItem = getCurrentAccountNavItem(pathname);

  return (
    <nav className={className} aria-label={tAccount("title")}>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              className="border-border bg-background text-foreground focus-visible:border-ring focus-visible:ring-ring/50 hover:bg-accent/50 flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm font-medium transition-colors outline-none focus-visible:ring-3"
              aria-label={tAccount("title")}
            />
          }
        >
          {currentItem ? tNav(currentItem.labelKey) : tAccount("title")}
          <ChevronDownIcon aria-hidden="true" className="size-4 shrink-0" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" sideOffset={8} className={"space-y-1"}>
          {accountNavItems.map((item) => (
            <DropdownMenuItem
              key={item.href}
              render={
                <NavLink
                  href={item.href}
                  matchNested={item.href !== "/account"}
                  className="data-current:bg-accent data-current:text-accent-foreground w-full cursor-pointer py-1.5 whitespace-nowrap"
                />
              }
            >
              {tNav(item.labelKey)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
}

type AccountLayoutProps = {
  children: React.ReactNode;
};

export function AccountLayout({ children }: AccountLayoutProps) {
  const t = useTranslations("pages.account.nav");

  return (
    <div className="grid gap-6 md:grid-cols-[auto_1fr] md:gap-12">
      <AccountMobileNav className="md:hidden" />

      <nav className="relative hidden w-64 md:block">
        <ul className="sticky top-[calc(var(--navbar-height,96px)+2rem)] flex flex-col gap-1">
          {accountNavItems.map((item) => {
            return (
              <li key={item.href}>
                <NavLink
                  href={item.href}
                  matchNested={item.href !== "/account"}
                  className={
                    "text-muted-foreground hover:bg-accent/50 hover:text-foreground data-current:bg-accent data-current:text-accent-foreground flex rounded-md px-3 py-2 text-sm font-medium transition-colors"
                  }
                >
                  {t(item.labelKey)}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="min-w-0">{children}</div>
    </div>
  );
}
