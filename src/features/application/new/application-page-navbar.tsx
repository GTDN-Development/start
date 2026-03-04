"use client";

import { Button } from "@/components/ui/button";
import { SidebarIcon } from "lucide-react";
import { FloatingBar } from "@/components/layout/floating-bar";
import { cn } from "@/lib/utils";
import { Container } from "@/components/ui/container";
import {
  MobileMenu,
  MobileMenuClose,
  MobileMenuContent,
  MobileMenuFooter,
  MobileMenuHeader,
  MobileMenuTitle,
  MobileMenuTrigger,
} from "@/components/ui/mobile-menu";
import { UserAccountMenu } from "@/features/account/user-account-menu";
import { ApplicationMenuTree } from "./application-menu-tree";
import { useSidebarContext } from "./application-layout";

export type ApplicationPageNavbarProps = {
  breadcrumbs: React.ReactNode;
};

export function ApplicationPageNavbar({ breadcrumbs }: ApplicationPageNavbarProps) {
  const { isSidebarOpen, setIsSidebarOpen, user, locale, userMenuLabels, mobileMenuLabels } =
    useSidebarContext();

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
            aria-label={mobileMenuLabels.openAriaLabel}
            className="max-lg:hidden"
          >
            <SidebarIcon aria-hidden="true" />
          </Button>

          <div className="lg:hidden">
            <MobileMenu>
              <Button
                variant="secondary"
                size="icon-lg"
                aria-label={mobileMenuLabels.openAriaLabel}
                render={<MobileMenuTrigger />}
              >
                <SidebarIcon aria-hidden="true" />
              </Button>
              <MobileMenuContent>
                <MobileMenuHeader>
                  <MobileMenuTitle>{mobileMenuLabels.title}</MobileMenuTitle>
                </MobileMenuHeader>

                <div className="mt-6">
                  <ApplicationMenuTree variant="mobile" />

                  <MobileMenuFooter className="mt-6">
                    <Button
                      variant="secondary"
                      size="lg"
                      className="w-full"
                      render={<MobileMenuClose />}
                    >
                      {mobileMenuLabels.close}
                    </Button>
                  </MobileMenuFooter>
                </div>
              </MobileMenuContent>
            </MobileMenu>
          </div>

          {/* Breadcrumbs */}
          <div className="min-w-0 max-lg:hidden">{breadcrumbs}</div>
        </div>

        {/* Right side */}
        <div className="flex flex-1 items-center justify-end gap-x-4">
          <UserAccountMenu viewer={user} locale={locale} labels={userMenuLabels} />
        </div>
      </Container>
    </FloatingBar>
  );
}
