"use client";

import { LogOutIcon } from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useSignOut } from "@/features/auth/use-sign-out";
import { useSidebarContext } from "./application-layout";

export function ApplicationSidebarSignOut() {
  const { isMobile, setOpenMobile } = useSidebar();
  const { userMenuLabels } = useSidebarContext();
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
