"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { CheckIcon, ChevronsUpDownIcon, PlusIcon } from "lucide-react";
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
import { switchWorkspaceAction } from "@/features/workspaces/actions/workspace-actions";
import { useWorkspaceNavigation } from "@/features/workspaces/workspace-navigation-context";
import type { WorkspaceNavigationItem } from "@/features/workspaces/workspace-types";
import { type AppHref, usePathname, useRouter } from "@/i18n/navigation";
import { getUserInitials } from "@/lib/app-utils";
import { cn } from "@/lib/utils";
import { WorkspaceAvatar, WorkspaceAvatarFallback, WorkspaceAvatarImage } from "./workspace-avatar";
import { WorkspaceCreateDrawer } from "./workspace-create-drawer";

type WorkspaceOption = WorkspaceNavigationItem & {
  initials: string;
  chipClassName: string;
};

export function WorkspaceSwitcher() {
  const t = useTranslations("layout.application.workspaceSwitcher");
  const { isMobile } = useSidebar();
  const { activeWorkspaceSlug, workspaces } = useWorkspaceNavigation();

  const pathname = usePathname();
  const router = useRouter();

  const [isSwitchingWorkspace, startSwitchWorkspaceTransition] = useTransition();
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);
  const [failedAvatarUrls, setFailedAvatarUrls] = useState<string[]>([]);
  const [isCreateWorkspaceDrawerOpen, setIsCreateWorkspaceDrawerOpen] = useState(false);

  const workspaceOptions = workspaces.map(createWorkspaceOption);
  const activeWorkspace =
    workspaceOptions.find((workspace) => workspace.slug === activeWorkspaceSlug) ??
    workspaceOptions[0] ??
    null;
  const activeWorkspaceAvatarUrl = activeWorkspace
    ? getWorkspaceAvatarUrl(activeWorkspace, failedAvatarUrls)
    : null;

  function handleWorkspaceAvatarError(avatarUrl: string) {
    setFailedAvatarUrls((currentUrls) => {
      if (currentUrls.includes(avatarUrl)) {
        return currentUrls;
      }

      return [...currentUrls, avatarUrl];
    });
  }

  function handleWorkspaceSwitch(workspace: WorkspaceOption) {
    if (isSwitchingWorkspace || activeWorkspace?.slug === workspace.slug) {
      return;
    }

    setIsWorkspaceMenuOpen(false);

    startSwitchWorkspaceTransition(async () => {
      const response = await switchWorkspaceAction(workspace.slug);

      if (!response.ok) {
        return;
      }

      const targetHref = resolveWorkspaceSwitchHref(pathname, response.data.workspaceSlug);
      router.replace(targetHref);
    });
  }

  function handleCreateWorkspaceClick() {
    if (isSwitchingWorkspace) {
      return;
    }

    setIsWorkspaceMenuOpen(false);
    requestAnimationFrame(() => {
      setIsCreateWorkspaceDrawerOpen(true);
    });
  }

  function handleCreateWorkspaceDrawerOpenChange(open: boolean) {
    if (open) {
      setIsWorkspaceMenuOpen(false);
    }

    setIsCreateWorkspaceDrawerOpen(open);
  }

  if (!activeWorkspace) {
    return null;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu open={isWorkspaceMenuOpen} onOpenChange={setIsWorkspaceMenuOpen}>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              />
            }
          >
            <WorkspaceAvatar key={activeWorkspace.id}>
              {activeWorkspaceAvatarUrl ? (
                <WorkspaceAvatarImage
                  src={activeWorkspaceAvatarUrl}
                  alt=""
                  onError={() => handleWorkspaceAvatarError(activeWorkspaceAvatarUrl)}
                />
              ) : (
                <WorkspaceAvatarFallback
                  className={cn(activeWorkspace.chipClassName, "text-xs font-semibold")}
                >
                  {activeWorkspace.initials}
                </WorkspaceAvatarFallback>
              )}
            </WorkspaceAvatar>
            <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">{activeWorkspace.name}</span>
              <span className="truncate text-xs">{activeWorkspace.slug}</span>
            </div>
            <ChevronsUpDownIcon aria-hidden="true" className="ml-auto size-4" />
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs">{t("labels.workspaces")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {workspaceOptions.map((workspace) => {
                const workspaceAvatarUrl = getWorkspaceAvatarUrl(workspace, failedAvatarUrls);

                return (
                  <DropdownMenuItem
                    key={workspace.id}
                    className="gap-2 p-2"
                    onClick={() => handleWorkspaceSwitch(workspace)}
                    disabled={isSwitchingWorkspace}
                  >
                    <WorkspaceAvatar size="sm">
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
                      <span className="text-muted-foreground truncate text-xs">
                        {workspace.slug}
                      </span>
                    </div>
                    {workspace.slug === activeWorkspace.slug && (
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
          onOpenChange={handleCreateWorkspaceDrawerOpenChange}
        />
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

function createWorkspaceOption(workspace: WorkspaceNavigationItem): WorkspaceOption {
  return {
    ...workspace,
    initials: getUserInitials(workspace.name),
    chipClassName:
      workspace.kind === "personal"
        ? "bg-sidebar-primary text-sidebar-primary-foreground hover:text-sidebar-primary-foreground"
        : "bg-emerald-600 text-white hover:text-white",
  };
}

function getWorkspaceAvatarUrl(workspace: WorkspaceOption, failedAvatarUrls: string[]) {
  if (!workspace.avatarUrl) {
    return null;
  }

  return failedAvatarUrls.includes(workspace.avatarUrl) ? null : workspace.avatarUrl;
}

function resolveWorkspaceSwitchHref(pathname: string, workspaceSlug: string): AppHref {
  const segments = pathname.split("/").filter(Boolean);

  if (segments[0] !== "w" || segments.length < 2) {
    return {
      pathname: "/w/[workspaceSlug]/overview",
      params: {
        workspaceSlug,
      },
    };
  }

  const nextWorkspacePath = `/${["w", workspaceSlug, ...segments.slice(2)].join("/")}`;

  return nextWorkspacePath as AppHref;
}
