"use client";

import { NavLink } from "@/components/layout/nav-link";
import { MobileMenuClose } from "@/components/ui/mobile-menu";
import { applicationMenu } from "@/config/menu";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

type ApplicationMenuTreeVariant = "sidebar" | "mobile";

type ApplicationMenuTreeProps = React.ComponentProps<"nav"> & {
  variant?: ApplicationMenuTreeVariant;
};

export function ApplicationMenuTree({
  className,
  variant = "sidebar",
  ...props
}: ApplicationMenuTreeProps) {
  const tNav = useTranslations("layout.navigation.items");
  const isMobile = variant === "mobile";

  return (
    <nav {...props} className={cn(className)}>
      <ul className={cn(isMobile ? "divide-border flex flex-col divide-y" : "flex flex-col gap-1")}>
        {applicationMenu.map((item) => (
          <li key={item.href}>
            {isMobile ? (
              <MobileMenuClose
                render={
                  <NavLink
                    href={item.href}
                    matchNested={item.href !== "/overview"}
                    className="text-foreground block w-full py-3 text-sm font-medium"
                  />
                }
              >
                {tNav(item.labelKey)}
              </MobileMenuClose>
            ) : (
              <NavLink
                href={item.href}
                matchNested={item.href !== "/overview"}
                className={
                  "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-current:bg-sidebar-accent data-current:text-sidebar-accent-foreground flex rounded-md px-3 py-2 text-sm font-medium transition-colors"
                }
              >
                {tNav(item.labelKey)}
              </NavLink>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
