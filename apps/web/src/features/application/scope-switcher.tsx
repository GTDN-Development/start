"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { CheckIcon, ChevronsUpDownIcon, PlusIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useOptionalAccountProfile } from "@/features/account/account-profile-context";
import { resolveApplicationScope } from "@/features/application/application-scope";
import { resolveSelectedOrganizationSlug } from "@/features/application/organization-selection";
import { switchOrganizationAction } from "@/features/organizations/settings/general/organization-general-actions";
import {
  useApplyOrganizationNavigationPatch,
  useOptionalOrganizationNavigation,
} from "@/features/organizations/organization-navigation-context";
import type { OrganizationNavigationItem } from "@/features/organizations/organization-navigation-types";
import { usePathname, useRouter } from "@/i18n/navigation";
import { getAvatarColorClass, getUserInitials } from "@/lib/app-utils";
import { cn } from "@/lib/utils";
import { organizationConfig } from "@/config/organization";
import { APP_HOME_PATH } from "@/config/routes";
import {
  OrganizationAvatar,
  OrganizationAvatarFallback,
  OrganizationAvatarImage,
} from "@/features/organizations/organization-avatar";
import { OrganizationCreateDrawer } from "@/features/organizations/organization-create-drawer";

type OrganizationOption = OrganizationNavigationItem & {
  initials: string;
  chipClassName: string;
};

type ScopeSwitcherProps = {
  className?: string;
};

export function ScopeSwitcher({ className }: ScopeSwitcherProps) {
  const areOrganizationsEnabled = organizationConfig.enabled;

  if (!areOrganizationsEnabled) {
    return null;
  }

  return <EnabledScopeSwitcher className={className} />;
}

function EnabledScopeSwitcher({ className }: ScopeSwitcherProps) {
  const t = useTranslations("layout.application.scopeSwitcher");
  const accountProfile = useOptionalAccountProfile();
  const organizationNavigation = useOptionalOrganizationNavigation();
  const activeOrganizationSlug = organizationNavigation?.activeOrganizationSlug ?? null;
  const organizations = organizationNavigation?.organizations ?? [];
  const applyOrganizationNavigationPatch = useApplyOrganizationNavigationPatch();

  const pathname = usePathname();
  const router = useRouter();
  const { isMobile, setOpenMobile } = useSidebar();

  const [isSwitchingOrganization, startSwitchOrganizationTransition] = useTransition();
  const [isScopeMenuOpen, setIsScopeMenuOpen] = useState(false);
  const [failedAvatarUrls, setFailedAvatarUrls] = useState<string[]>([]);
  const [failedPersonalAvatarUrl, setFailedPersonalAvatarUrl] = useState<string | null>(null);
  const [isCreateOrganizationDrawerOpen, setIsCreateOrganizationDrawerOpen] = useState(false);

  const organizationOptions = organizations.map(createOrganizationOption);
  const currentUser = accountProfile?.profile ?? null;
  const personalLabel = getPersonalScopeLabel(
    currentUser?.name ?? null,
    currentUser?.email ?? null
  );
  const personalInitials = getUserInitials(personalLabel);
  const personalAvatarColorClass = currentUser ? getAvatarColorClass(currentUser.id) : "";
  const personalAvatarFallbackClassName = cn(
    personalAvatarColorClass,
    "group-focus/dropdown-menu-item:!text-white"
  );
  const personalAvatarUrl =
    currentUser?.avatarUrl && currentUser.avatarUrl !== failedPersonalAvatarUrl
      ? currentUser.avatarUrl
      : null;
  const selectedOrganizationSlug = resolveSelectedOrganizationSlug(
    pathname,
    activeOrganizationSlug,
    organizations
  );
  const selectedOrganization =
    organizationOptions.find((organization) => organization.slug === selectedOrganizationSlug) ??
    null;
  const applicationScope = resolveApplicationScope(pathname);
  const activeOrganizationAvatarUrl = selectedOrganization
    ? getOrganizationAvatarUrl(selectedOrganization, failedAvatarUrls)
    : null;
  const isPersonalScope = applicationScope === "personal";

  function handleOrganizationAvatarError(avatarUrl: string) {
    setFailedAvatarUrls((currentUrls) => {
      if (currentUrls.includes(avatarUrl)) {
        return currentUrls;
      }

      return [...currentUrls, avatarUrl];
    });
  }

  function handlePersonalScopeClick() {
    if (isSwitchingOrganization) {
      return;
    }

    if (isMobile) {
      setOpenMobile(false);
    }

    setIsScopeMenuOpen(false);
    router.replace(APP_HOME_PATH);
  }

  function handleOrganizationSwitch(organization: OrganizationOption) {
    if (
      isSwitchingOrganization ||
      (applicationScope === "organization" && selectedOrganization?.slug === organization.slug)
    ) {
      return;
    }

    if (isMobile) {
      setOpenMobile(false);
    }

    setIsScopeMenuOpen(false);

    startSwitchOrganizationTransition(async () => {
      const response = await switchOrganizationAction(organization.slug);

      if (!response.ok) {
        return;
      }

      applyOrganizationNavigationPatch(response.data.navigationPatch);
    });
  }

  function handleCreateOrganizationClick() {
    if (isSwitchingOrganization) {
      return;
    }

    if (isMobile) {
      setOpenMobile(false);
    }

    setIsScopeMenuOpen(false);
    requestAnimationFrame(() => {
      setIsCreateOrganizationDrawerOpen(true);
    });
  }

  function handleCreateOrganizationDrawerOpenChange(open: boolean) {
    if (open) {
      setIsScopeMenuOpen(false);
    }

    setIsCreateOrganizationDrawerOpen(open);
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu open={isScopeMenuOpen} onOpenChange={setIsScopeMenuOpen}>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className={cn(
                  "data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground",
                  className
                )}
              />
            }
          >
            {isPersonalScope || !selectedOrganization ? (
              <Avatar key={personalAvatarUrl ?? "fallback"}>
                {personalAvatarUrl ? (
                  <AvatarImage
                    src={personalAvatarUrl}
                    alt=""
                    onError={() => setFailedPersonalAvatarUrl(personalAvatarUrl)}
                  />
                ) : (
                  <AvatarFallback className={personalAvatarFallbackClassName}>
                    {personalInitials}
                  </AvatarFallback>
                )}
              </Avatar>
            ) : (
              <OrganizationAvatar
                key={getOrganizationAvatarStateKey(
                  selectedOrganization,
                  activeOrganizationAvatarUrl
                )}
              >
                {activeOrganizationAvatarUrl ? (
                  <OrganizationAvatarImage
                    src={activeOrganizationAvatarUrl}
                    alt=""
                    onError={() => handleOrganizationAvatarError(activeOrganizationAvatarUrl)}
                  />
                ) : (
                  <OrganizationAvatarFallback
                    className={cn(selectedOrganization.chipClassName, "text-xs font-semibold")}
                  >
                    {selectedOrganization.initials}
                  </OrganizationAvatarFallback>
                )}
              </OrganizationAvatar>
            )}
            <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">
                {isPersonalScope || !selectedOrganization
                  ? personalLabel
                  : selectedOrganization.name}
              </span>
            </div>
            <ChevronsUpDownIcon aria-hidden="true" className="ml-auto size-4" />
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="min-w-56 rounded-lg"
            align="start"
            side="bottom"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuItem
                className="gap-2 p-2"
                disabled={isSwitchingOrganization}
                onClick={handlePersonalScopeClick}
              >
                <Avatar key={`personal:${personalAvatarUrl ?? "fallback"}`} size="sm">
                  {personalAvatarUrl ? (
                    <AvatarImage
                      src={personalAvatarUrl}
                      alt=""
                      onError={() => setFailedPersonalAvatarUrl(personalAvatarUrl)}
                    />
                  ) : (
                    <AvatarFallback className={personalAvatarFallbackClassName}>
                      {personalInitials}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{personalLabel}</span>
                </div>
                {isPersonalScope && <CheckIcon aria-hidden="true" className="size-4" />}
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs">
                {t("labels.organizations")}
              </DropdownMenuLabel>
              {organizationOptions.length === 0 && (
                <DropdownMenuItem className="pointer-events-none p-2 opacity-100">
                  <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{t("empty.title")}</span>
                    <span className="text-muted-foreground truncate text-xs">
                      {t("empty.description")}
                    </span>
                  </div>
                </DropdownMenuItem>
              )}
              {organizationOptions.map((organization) => {
                const organizationAvatarUrl = getOrganizationAvatarUrl(
                  organization,
                  failedAvatarUrls
                );

                return (
                  <DropdownMenuItem
                    key={organization.id}
                    className="gap-2 p-2"
                    onClick={() => handleOrganizationSwitch(organization)}
                    disabled={isSwitchingOrganization}
                  >
                    <OrganizationAvatar
                      key={getOrganizationAvatarStateKey(organization, organizationAvatarUrl)}
                      size="sm"
                    >
                      {organizationAvatarUrl ? (
                        <OrganizationAvatarImage
                          src={organizationAvatarUrl}
                          alt=""
                          onError={() => handleOrganizationAvatarError(organizationAvatarUrl)}
                        />
                      ) : (
                        <OrganizationAvatarFallback
                          className={cn(organization.chipClassName, "text-xs font-semibold")}
                        >
                          {organization.initials}
                        </OrganizationAvatarFallback>
                      )}
                    </OrganizationAvatar>
                    <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">{organization.name}</span>
                    </div>
                    {organization.slug === selectedOrganization?.slug &&
                      applicationScope === "organization" && (
                        <CheckIcon aria-hidden="true" className="size-4" />
                      )}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 p-2"
              disabled={isSwitchingOrganization}
              onClick={handleCreateOrganizationClick}
            >
              <div className="bg-background border-border flex size-6 items-center justify-center rounded-md border">
                <PlusIcon aria-hidden="true" className="size-4" />
              </div>
              <span className="font-medium">{t("actions.create")}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <OrganizationCreateDrawer
          open={isCreateOrganizationDrawerOpen}
          onOpenChangeAction={handleCreateOrganizationDrawerOpenChange}
        />
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

function createOrganizationOption(organization: OrganizationNavigationItem): OrganizationOption {
  return {
    ...organization,
    initials: getUserInitials(organization.name),
    chipClassName: cn(
      getAvatarColorClass(organization.id),
      "group-focus/dropdown-menu-item:!text-white"
    ),
  };
}

function getOrganizationAvatarUrl(organization: OrganizationOption, failedAvatarUrls: string[]) {
  if (!organization.avatarUrl) {
    return null;
  }

  return failedAvatarUrls.includes(organization.avatarUrl) ? null : organization.avatarUrl;
}

function getOrganizationAvatarStateKey(organization: OrganizationOption, avatarUrl: string | null) {
  return `${organization.id}:${avatarUrl ?? "fallback"}`;
}

function getPersonalScopeLabel(name: string | null, email: string | null) {
  const normalizedName = name?.trim();

  if (normalizedName) {
    return normalizedName;
  }

  return email ?? "";
}
