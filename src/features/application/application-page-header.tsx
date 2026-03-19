"use client";

import { FloatingBar } from "@/components/layout/floating-bar";
import type { LinkHref } from "@/components/ui/link";
import { cn } from "@/lib/utils";
import { Container } from "@/components/ui/container";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserAccountMenu } from "@/features/account/user-account-menu";
import { usePathname } from "@/i18n/navigation";
import { useSidebarContext } from "./application-layout";
import { resolveSelectedWorkspaceSlug } from "./workspace-routing";

export type ApplicationPageHeaderProps = {
  breadcrumbs: React.ReactNode;
};

export function ApplicationPageHeader({ breadcrumbs }: ApplicationPageHeaderProps) {
  const pathname = usePathname();
  const { user, locale, userMenuLabels, mobileMenuLabels, activeWorkspaceSlug, workspaces } =
    useSidebarContext();
  const selectedWorkspaceSlug = resolveSelectedWorkspaceSlug(
    pathname,
    activeWorkspaceSlug,
    workspaces
  );
  const overviewHref = resolveOverviewHref(selectedWorkspaceSlug);

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
        "bg-background/75 border-b backdrop-blur-2xl"
      )}
    >
      <Container size="full" className="flex h-full min-w-0 shrink items-center gap-x-4">
        {/* Left side */}
        <div className="flex min-w-0 flex-1 items-center gap-x-4">
          <SidebarTrigger
            variant="secondary"
            size="icon-lg"
            aria-label={mobileMenuLabels.openAriaLabel}
            className="shrink-0"
          />

          {/* Breadcrumbs */}
          <div className="min-w-0 max-lg:hidden">{breadcrumbs}</div>
        </div>

        {/* Right side */}
        <div className="flex min-w-0 flex-1 items-center justify-end gap-x-4">
          <UserAccountMenu
            viewer={user}
            locale={locale}
            labels={userMenuLabels}
            overviewHref={overviewHref}
          />
        </div>
      </Container>
    </FloatingBar>
  );
}

function resolveOverviewHref(selectedWorkspaceSlug: string | null): LinkHref {
  if (!selectedWorkspaceSlug) {
    return "/overview";
  }

  return {
    pathname: "/w/[workspaceSlug]/overview",
    params: {
      workspaceSlug: selectedWorkspaceSlug,
    },
  };
}
