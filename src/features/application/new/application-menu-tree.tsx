"use client";

import { NavLink } from "@/components/layout/nav-link";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { applicationMenu } from "@/config/menu";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

export function ApplicationMenuTree({ className, ...props }: React.ComponentProps<"nav">) {
  const tNav = useTranslations("layout.navigation.items");
  const { isMobile, setOpenMobile } = useSidebar();

  function handleItemClick() {
    if (isMobile) {
      setOpenMobile(false);
    }
  }

  return (
    <nav {...props} className={cn(className)}>
      <SidebarMenu>
        {applicationMenu.map((item) => (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton
              tooltip={tNav(item.labelKey)}
              render={
                <NavLink
                  href={item.href}
                  matchNested={item.href !== "/overview"}
                  onClick={handleItemClick}
                />
              }
              className="text-sidebar-foreground/80 data-[current=true]:bg-sidebar-accent data-[current=true]:text-sidebar-accent-foreground"
            >
              {tNav(item.labelKey)}
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </nav>
  );
}
