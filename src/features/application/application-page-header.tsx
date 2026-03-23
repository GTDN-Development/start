"use client";

import { FloatingBar } from "@/components/layout/floating-bar";
import { Container } from "@/components/ui/container";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserAccountMenu } from "@/features/account/user-account-menu";
import { usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { getWorkspaceSlugFromPathname, resolveApplicationScope } from "./application-scope";
import { useSidebarContext } from "./application-layout";
import { resolveSelectedWorkspaceSlug } from "./workspace-routing";

export type ApplicationPageHeaderProps = {
  breadcrumbs: React.ReactNode;
};

export function ApplicationPageHeader({ breadcrumbs }: ApplicationPageHeaderProps) {
  const { user, locale, userMenuLabels, mobileMenuLabels, activeWorkspaceSlug, workspaces } =
    useSidebarContext();
  const pathname = usePathname();
  const tNav = useTranslations("layout.navigation.items");
  const tScopeSwitcher = useTranslations("layout.application.scopeSwitcher");
  const applicationScope = resolveApplicationScope(pathname);
  const pathnameWorkspaceSlug = getWorkspaceSlugFromPathname(pathname);
  const selectedWorkspaceSlug = resolveSelectedWorkspaceSlug(
    pathname,
    activeWorkspaceSlug,
    workspaces
  );
  const currentWorkspace =
    workspaces.find((workspace) => workspace.slug === pathnameWorkspaceSlug) ??
    workspaces.find((workspace) => workspace.slug === selectedWorkspaceSlug) ??
    null;
  const scopeLabel =
    applicationScope === "workspace"
      ? (currentWorkspace?.name ?? tNav("workspace"))
      : tScopeSwitcher("personal.label");

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

          <span className="bg-muted text-muted-foreground inline-flex max-w-40 items-center rounded-full px-2.5 py-1 text-xs font-medium lg:hidden">
            <span className="truncate">{scopeLabel}</span>
          </span>

          <div className="min-w-0 max-lg:hidden">{breadcrumbs}</div>
        </div>

        {/* Right side */}
        <div className="flex min-w-0 flex-1 items-center justify-end gap-x-4">
          <UserAccountMenu viewer={user} locale={locale} labels={userMenuLabels} appHref="/app" />
        </div>
      </Container>
    </FloatingBar>
  );
}
