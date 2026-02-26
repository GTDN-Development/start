"use client";

import { NavLink } from "@/components/shared/layout/nav-link";
import { useTranslations } from "next-intl";

type AccountNavItem = {
  href: "/account" | "/account/security";
  labelKey: "general" | "security";
};

const accountNavItems: AccountNavItem[] = [
  { href: "/account", labelKey: "general" },
  { href: "/account/security", labelKey: "security" },
];

type AccountLayoutProps = {
  children: React.ReactNode;
};

export function AccountLayout({ children }: AccountLayoutProps) {
  const t = useTranslations("pages.account.nav");

  return (
    <div className="grid gap-12 md:grid-cols-[auto_1fr]">
      <nav className="w-64">
        <ul className="flex flex-col gap-1">
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
