"use client";

import { SidebarMenu, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import {
  personalApplicationMenu,
  organizationApplicationMenu,
  type ApplicationMenuLink,
} from "@/config/menu";
import {
  APP_DOCUMENT_EXPORT_PATH,
  APP_HOME_PATH,
  getOrganizationDocumentExportHref,
  getOrganizationOverviewHref,
  getOrganizationSettingsHref,
} from "@/config/routes";
import { useOptionalOrganizationNavigation } from "@/features/organizations/organization-navigation-context";
import { AppHref, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { ApplicationSidebarNavButton } from "./application-sidebar-nav-button";
import { resolveApplicationScope } from "./application-scope";
import { resolveSelectedOrganizationSlug } from "./organization-selection";

function resolveMenuHref(
  item: ApplicationMenuLink,
  selectedOrganizationSlug: string | null
): AppHref {
  if (item.labelKey === "home") {
    return item.href;
  }

  if (item.labelKey === "documentExport" && item.href === APP_DOCUMENT_EXPORT_PATH) {
    return APP_DOCUMENT_EXPORT_PATH;
  }

  if (!selectedOrganizationSlug) {
    return APP_HOME_PATH;
  }

  if (item.labelKey === "overview") {
    return getOrganizationOverviewHref(selectedOrganizationSlug);
  }

  if (item.labelKey === "documentExport") {
    return getOrganizationDocumentExportHref(selectedOrganizationSlug);
  }

  return getOrganizationSettingsHref(selectedOrganizationSlug);
}

export function ApplicationMenuTree({ className, ...props }: React.ComponentProps<"nav">) {
  const tNav = useTranslations("layout.navigation.items");

  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const organizationNavigation = useOptionalOrganizationNavigation();
  const activeOrganizationSlug = organizationNavigation?.activeOrganizationSlug ?? null;
  const organizations = organizationNavigation?.organizations ?? [];
  const applicationScope = resolveApplicationScope(pathname);

  const selectedOrganizationSlug = resolveSelectedOrganizationSlug(
    pathname,
    activeOrganizationSlug,
    organizations
  );
  const visibleApplicationMenu =
    applicationScope === "organization" && selectedOrganizationSlug
      ? organizationApplicationMenu
      : personalApplicationMenu;

  function handleItemClick() {
    if (isMobile) {
      setOpenMobile(false);
    }
  }

  return (
    <nav {...props} className={cn(className)}>
      <SidebarMenu className="gap-1">
        {visibleApplicationMenu.map((item) => {
          const itemHref = resolveMenuHref(item, selectedOrganizationSlug);
          const itemLabel = tNav(item.labelKey);
          const ItemIcon = item.icon;

          return (
            <SidebarMenuItem key={item.labelKey}>
              <ApplicationSidebarNavButton
                href={itemHref}
                icon={ItemIcon}
                label={itemLabel}
                matchNested={"matchNested" in item && item.matchNested === true}
                onClick={handleItemClick}
              />
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </nav>
  );
}
