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
import { resolveSelectedWorkspaceSlug } from "@/features/application/workspace-selection";
import { switchWorkspaceAction } from "@/features/workspaces/settings/general/workspace-general-actions";
import { useOptionalWorkspaceNavigation } from "@/features/workspaces/workspace-navigation-context";
import type { WorkspaceNavigationItem } from "@/features/workspaces/workspace-navigation-types";
import { usePathname, useRouter } from "@/i18n/navigation";
import { getAvatarColorClass, getUserInitials } from "@/lib/app-utils";
import { cn } from "@/lib/utils";
import { APP_HOME_PATH, getWorkspaceOverviewHref } from "@/config/routes";
import {
  WorkspaceAvatar,
  WorkspaceAvatarFallback,
  WorkspaceAvatarImage,
} from "@/features/workspaces/workspace-avatar";
import { WorkspaceCreateDrawer } from "@/features/workspaces/workspace-create-drawer";

type WorkspaceOption = WorkspaceNavigationItem & {
  initials: string;
  chipClassName: string;
};

type ScopeSwitcherProps = {
  className?: string;
};

export function ScopeSwitcher({ className }: ScopeSwitcherProps) {
  const t = useTranslations("layout.application.scopeSwitcher");
  const accountProfile = useOptionalAccountProfile();
  const workspaceNavigation = useOptionalWorkspaceNavigation();
  const activeWorkspaceSlug = workspaceNavigation?.activeWorkspaceSlug ?? null;
  const workspaces = workspaceNavigation?.workspaces ?? [];
  const setActiveWorkspaceSlug = workspaceNavigation?.setActiveWorkspaceSlug;

  const pathname = usePathname();
  const router = useRouter();
  const { isMobile, setOpenMobile } = useSidebar();

  const [isSwitchingWorkspace, startSwitchWorkspaceTransition] = useTransition();
  const [isScopeMenuOpen, setIsScopeMenuOpen] = useState(false);
  const [failedAvatarUrls, setFailedAvatarUrls] = useState<string[]>([]);
  const [failedPersonalAvatarUrl, setFailedPersonalAvatarUrl] = useState<string | null>(null);
  const [isCreateWorkspaceDrawerOpen, setIsCreateWorkspaceDrawerOpen] = useState(false);

  const workspaceOptions = workspaces.map(createWorkspaceOption);
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
  const selectedWorkspaceSlug = resolveSelectedWorkspaceSlug(
    pathname,
    activeWorkspaceSlug,
    workspaces
  );
  const selectedWorkspace =
    workspaceOptions.find((workspace) => workspace.slug === selectedWorkspaceSlug) ?? null;
  const applicationScope = resolveApplicationScope(pathname);
  const activeWorkspaceAvatarUrl = selectedWorkspace
    ? getWorkspaceAvatarUrl(selectedWorkspace, failedAvatarUrls)
    : null;
  const isPersonalScope = applicationScope === "personal";

  function handleWorkspaceAvatarError(avatarUrl: string) {
    setFailedAvatarUrls((currentUrls) => {
      if (currentUrls.includes(avatarUrl)) {
        return currentUrls;
      }

      return [...currentUrls, avatarUrl];
    });
  }

  function handlePersonalScopeClick() {
    if (isSwitchingWorkspace) {
      return;
    }

    if (isMobile) {
      setOpenMobile(false);
    }

    setIsScopeMenuOpen(false);
    router.replace(APP_HOME_PATH);
  }

  function handleWorkspaceSwitch(workspace: WorkspaceOption) {
    if (
      isSwitchingWorkspace ||
      (applicationScope === "workspace" && selectedWorkspace?.slug === workspace.slug)
    ) {
      return;
    }

    if (isMobile) {
      setOpenMobile(false);
    }

    setIsScopeMenuOpen(false);

    startSwitchWorkspaceTransition(async () => {
      const response = await switchWorkspaceAction(workspace.slug);

      if (!response.ok) {
        return;
      }

      setActiveWorkspaceSlug?.(response.data.workspaceSlug);
      router.replace(getWorkspaceOverviewHref(response.data.workspaceSlug));
    });
  }

  function handleCreateWorkspaceClick() {
    if (isSwitchingWorkspace) {
      return;
    }

    if (isMobile) {
      setOpenMobile(false);
    }

    setIsScopeMenuOpen(false);
    requestAnimationFrame(() => {
      setIsCreateWorkspaceDrawerOpen(true);
    });
  }

  function handleCreateWorkspaceDrawerOpenChange(open: boolean) {
    if (open) {
      setIsScopeMenuOpen(false);
    }

    setIsCreateWorkspaceDrawerOpen(open);
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
            {isPersonalScope || !selectedWorkspace ? (
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
              <WorkspaceAvatar
                key={getWorkspaceAvatarStateKey(selectedWorkspace, activeWorkspaceAvatarUrl)}
              >
                {activeWorkspaceAvatarUrl ? (
                  <WorkspaceAvatarImage
                    src={activeWorkspaceAvatarUrl}
                    alt=""
                    onError={() => handleWorkspaceAvatarError(activeWorkspaceAvatarUrl)}
                  />
                ) : (
                  <WorkspaceAvatarFallback
                    className={cn(selectedWorkspace.chipClassName, "text-xs font-semibold")}
                  >
                    {selectedWorkspace.initials}
                  </WorkspaceAvatarFallback>
                )}
              </WorkspaceAvatar>
            )}
            <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">
                {isPersonalScope || !selectedWorkspace ? personalLabel : selectedWorkspace.name}
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
                disabled={isSwitchingWorkspace}
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
              <DropdownMenuLabel className="text-xs">{t("labels.workspaces")}</DropdownMenuLabel>
              {workspaceOptions.length === 0 && (
                <DropdownMenuItem className="pointer-events-none p-2 opacity-100">
                  <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{t("empty.title")}</span>
                    <span className="text-muted-foreground truncate text-xs">
                      {t("empty.description")}
                    </span>
                  </div>
                </DropdownMenuItem>
              )}
              {workspaceOptions.map((workspace) => {
                const workspaceAvatarUrl = getWorkspaceAvatarUrl(workspace, failedAvatarUrls);

                return (
                  <DropdownMenuItem
                    key={workspace.id}
                    className="gap-2 p-2"
                    onClick={() => handleWorkspaceSwitch(workspace)}
                    disabled={isSwitchingWorkspace}
                  >
                    <WorkspaceAvatar
                      key={getWorkspaceAvatarStateKey(workspace, workspaceAvatarUrl)}
                      size="sm"
                    >
                      {workspaceAvatarUrl ? (
                        <WorkspaceAvatarImage
                          src={workspaceAvatarUrl}
                          alt=""
                          onError={() => handleWorkspaceAvatarError(workspaceAvatarUrl)}
                        />
                      ) : (
                        <WorkspaceAvatarFallback
                          className={cn(workspace.chipClassName, "text-xs font-semibold")}
                        >
                          {workspace.initials}
                        </WorkspaceAvatarFallback>
                      )}
                    </WorkspaceAvatar>
                    <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">{workspace.name}</span>
                    </div>
                    {workspace.slug === selectedWorkspace?.slug &&
                      applicationScope === "workspace" && (
                        <CheckIcon aria-hidden="true" className="size-4" />
                      )}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 p-2"
              disabled={isSwitchingWorkspace}
              onClick={handleCreateWorkspaceClick}
            >
              <div className="bg-background border-border flex size-6 items-center justify-center rounded-md border">
                <PlusIcon aria-hidden="true" className="size-4" />
              </div>
              <span className="font-medium">{t("actions.create")}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <WorkspaceCreateDrawer
          open={isCreateWorkspaceDrawerOpen}
          onOpenChangeAction={handleCreateWorkspaceDrawerOpenChange}
        />
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

function createWorkspaceOption(workspace: WorkspaceNavigationItem): WorkspaceOption {
  return {
    ...workspace,
    initials: getUserInitials(workspace.name),
    chipClassName: cn(
      getAvatarColorClass(workspace.id),
      "group-focus/dropdown-menu-item:!text-white"
    ),
  };
}

function getWorkspaceAvatarUrl(workspace: WorkspaceOption, failedAvatarUrls: string[]) {
  if (!workspace.avatarUrl) {
    return null;
  }

  return failedAvatarUrls.includes(workspace.avatarUrl) ? null : workspace.avatarUrl;
}

function getWorkspaceAvatarStateKey(workspace: WorkspaceOption, avatarUrl: string | null) {
  return `${workspace.id}:${avatarUrl ?? "fallback"}`;
}

function getPersonalScopeLabel(name: string | null, email: string | null) {
  const normalizedName = name?.trim();

  if (normalizedName) {
    return normalizedName;
  }

  return email ?? "";
}
