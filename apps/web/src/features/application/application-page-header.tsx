"use client";

import { FloatingBar } from "@/components/layout/floating-bar";
import { LogoStart } from "@/components/brand/logo-start";
import { BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Container } from "@/components/ui/container";
import { Link } from "@/components/ui/link";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserAccountMenu } from "@/features/account/user-account-menu";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { useApplicationRootContext } from "./application-root";
import { ScopeSwitcher } from "./scope-switcher";

export type ApplicationPageHeaderProps = {
  breadcrumbs?: React.ReactNode;
  variant?: "default" | "account";
};

export function ApplicationPageHeader({
  breadcrumbs,
  variant = "default",
}: ApplicationPageHeaderProps) {
  const { user, userMenuLabels, mobileMenuLabels, applicationEntryHref } =
    useApplicationRootContext();
  const t = useTranslations("layout.header");

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
          {variant === "account" ? (
            <Link
              href={applicationEntryHref}
              aria-label={t("homeAriaLabel")}
              className="inline-flex w-fit"
            >
              <LogoStart aria-hidden="true" className="w-18" />
            </Link>
          ) : (
            <>
              <SidebarTrigger
                variant="ghost"
                aria-label={mobileMenuLabels.openAriaLabel}
                className="shrink-0"
              />

              <div className="hidden w-48 min-w-0 lg:block">
                <ScopeSwitcher />
              </div>

              {breadcrumbs && <BreadcrumbSeparator className="hidden shrink-0 lg:block" />}

              {breadcrumbs && <div className="min-w-0">{breadcrumbs}</div>}
            </>
          )}
        </div>

        {/* Right side */}
        <div className="flex min-w-0 items-center justify-end gap-x-4">
          <UserAccountMenu
            viewer={user}
            labels={userMenuLabels}
            applicationEntryHref={applicationEntryHref}
          />
        </div>
      </Container>
    </FloatingBar>
  );
}
