"use client";

import { LogOutIcon } from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useSignOut } from "@/features/auth/use-sign-out";
import { useApplicationRootContext } from "./application-root";

export function ApplicationSidebarSignOut() {
  const { isMobile, setOpenMobile } = useSidebar();
  const { userMenuLabels } = useApplicationRootContext();
  const { handleSignOut, isPending } = useSignOut();

  async function handleClick() {
    if (isMobile) {
      setOpenMobile(false);
    }

    await handleSignOut();
  }

  return (
    <SidebarMenu className="gap-1">
      <SidebarMenuItem>
        <SidebarMenuButton
          tooltip={userMenuLabels.signOut}
          disabled={isPending}
          onClick={handleClick}
          className="text-sidebar-foreground/80"
        >
          <LogOutIcon aria-hidden="true" />
          {userMenuLabels.signOut}
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
