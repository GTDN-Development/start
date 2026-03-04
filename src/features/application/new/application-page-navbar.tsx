"use client";

import {
  useContext,
  // useState
} from "react";
import { SidebarContext } from "./application-layout";
import { Button } from "@/components/ui/button";
import { SidebarIcon } from "lucide-react";
import { FloatingBar } from "@/components/layout/floating-bar";
import { cn } from "@/lib/utils";
import { Container } from "@/components/ui/container";

export type ApplicationPageNavbarProps = {
  breadcrumbs: React.ReactNode;
};

export function ApplicationPageNavbar({ breadcrumbs }: ApplicationPageNavbarProps) {
  // const [isMenuOpen, setIsMenuOpen] = useState(false);

  const {
    isSidebarOpen,
    setIsSidebarOpen,
    // isMobileSidebarOpen,
    // setIsMobileSidebarOpen
  } = useContext(SidebarContext);

  return (
    <FloatingBar
      position="sticky"
      autoHide={false}
      className={cn(
        // Base styles for the navbar
        "z-100 h-(--navbar-height,64px) w-full",
        // Transition and initial state
        "transform-gpu transition duration-300",
        // Initial state
        "bg-background/75 backdrop-blur-2xl"
      )}
    >
      <Container className="flex h-full min-w-0 shrink items-center gap-x-4 [--container-max-width:100%]">
        {/* Left side */}
        <div className="flex flex-1 items-center gap-x-4">
          {/* Sidebar toggle button on desktop */}
          <Button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            variant="secondary"
            size="icon-lg"
            aria-label="Open Sidebar"
            className="max-xl:hidden"
          >
            <SidebarIcon aria-hidden="true" />
          </Button>

          {/* Sidebar on mobile */}
          <div className="xl:hidden">
            <Button variant="secondary" size="icon-lg" aria-label="Start search">
              <SidebarIcon aria-hidden="true" />
            </Button>
          </div>

          {/* Breadcrumbs */}
          <div className="min-w-0 max-lg:hidden">{breadcrumbs}</div>
        </div>

        {/* Right side */}
        <div className="flex flex-1 items-center justify-end gap-x-4">
          <div className="text-sm">User Account Menu</div>
        </div>
      </Container>
    </FloatingBar>
  );
}
