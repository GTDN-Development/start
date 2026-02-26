"use client";

import { usePathname } from "@/i18n/navigation";
import { Link } from "@/components/ui/link";
import { cn } from "@/lib/utils";
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
  const pathname = usePathname();
  const t = useTranslations("pages.account.nav");

  return (
    <div className="grid gap-12 md:grid-cols-[auto_1fr]">
      <nav className="w-64">
        <ul className="flex flex-col gap-1">
          {accountNavItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/account" && pathname.startsWith(`${item.href}/`));

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  )}
                >
                  {t(item.labelKey)}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="min-w-0">{children}</div>
    </div>
  );
}
