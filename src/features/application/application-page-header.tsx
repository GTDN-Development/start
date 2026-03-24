"use client";

import { FloatingBar } from "@/components/layout/floating-bar";
import { BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Container } from "@/components/ui/container";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserSettingsMenu } from "@/features/settings/user-settings-menu";
import { cn } from "@/lib/utils";
import { useSidebarContext } from "./application-layout";
import { ScopeSwitcher } from "./scope-switcher";

export type ApplicationPageHeaderProps = {
  breadcrumbs: React.ReactNode;
};

export function ApplicationPageHeader({ breadcrumbs }: ApplicationPageHeaderProps) {
  const { user, userMenuLabels, mobileMenuLabels } = useSidebarContext();

  return (
    <FloatingBar
      position="sticky"
      autoHide={false}
      render={<header />}
      className={cn(
        // Base styles for the navbar
        "z-100 h-(--navbar-height,64px) w-full",
        // Transition and initial state
        "transform-gpu transition duration-300",
        // Initial state
        "bg-background/75 backdrop-blur-2xl"
      )}
    >
      <Container size="full" className="flex h-full min-w-0 shrink items-center gap-x-4">
        {/* Left side */}
        <div className="flex min-w-0 flex-1 items-center gap-x-2">
          <SidebarTrigger
            variant="ghost"
            aria-label={mobileMenuLabels.openAriaLabel}
            className="shrink-0"
          />

          <div className="hidden w-48 min-w-0 lg:block">
            <ScopeSwitcher />
          </div>

          <BreadcrumbSeparator className="hidden shrink-0 lg:block" />

          <div className="min-w-0">{breadcrumbs}</div>
        </div>

        {/* Right side */}
        <div className="flex min-w-0 items-center justify-end gap-x-4">
          <UserSettingsMenu viewer={user} labels={userMenuLabels} appHref="/app" />
        </div>
      </Container>
    </FloatingBar>
  );
}
