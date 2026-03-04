"use client";

import { createContext, useState } from "react";
import { ApplicationMenuTree } from "./application-menu-tree";
import clsx from "clsx";
import { Container } from "@/components/ui/container";
import { WorkspaceSwitcher } from "./workspace-switcher";

export const SidebarContext = createContext<{
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isSidebarOpen: boolean) => void;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (isMobileSidebarOpen: boolean) => void;
}>({
  isSidebarOpen: true,
  setIsSidebarOpen: () => {},
  isMobileSidebarOpen: false,
  setIsMobileSidebarOpen: () => {},
});

export function ApplicationLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <SidebarContext.Provider
      value={{
        isSidebarOpen,
        setIsSidebarOpen,
        isMobileSidebarOpen,
        setIsMobileSidebarOpen,
      }}
    >
      <div>
        <div className="bg-muted flex h-10 w-full items-center justify-center text-sm">
          Banneeer
        </div>
        <div
          data-sidebar-open={isSidebarOpen ? undefined : ""}
          className={clsx(
            "[--navbar-height:--spacing(16)]",
            "group relative isolate not-data-sidebar-open:grid xl:grid-cols-[auto_1fr]"
          )}
        >
          {/* Sidebar */}
          <aside className="bg-sidebar sticky top-0 left-0 hidden h-screen w-72 overflow-y-auto border-r group-data-sidebar-open:hidden xl:block">
            <div className="bg-sidebar sticky top-0">
              <Container className="flex gap-3 py-3.5">
                <WorkspaceSwitcher />
              </Container>
            </div>
            <Container render={<nav aria-label="sidebar menu" />}>
              <div className="pb-16">
                <ApplicationMenuTree className="max-xl:hidden" />
              </div>
            </Container>
          </aside>

          {/* Content */}
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </SidebarContext.Provider>
  );
}
