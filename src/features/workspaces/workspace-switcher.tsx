"use client";

import { useState } from "react";
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
import {
  WorkspaceAvatar,
  WorkspaceAvatarFallback,
  WorkspaceAvatarImage,
} from "./workspace-avatar";
import { CheckIcon, ChevronsUpDownIcon, PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

type WorkspaceOption = {
  id: string;
  name: string;
  plan: string;
  initials: string;
  avatarUrl: string | null;
  chipClassName: string;
};

export function WorkspaceSwitcher() {
  const t = useTranslations("layout.application.workspaceSwitcher");
  const { isMobile } = useSidebar();

  const workspaces: WorkspaceOption[] = [
    {
      id: "current",
      name: t("workspaces.current.name"),
      plan: t("workspaces.current.plan"),
      initials: t("workspaces.current.initials"),
      avatarUrl: "https://api.dicebear.com/9.x/initials/svg?seed=Current",
      chipClassName:
        "bg-sidebar-primary text-sidebar-primary-foreground hover:text-sidebar-primary-foreground",
    },
    {
      id: "alpha",
      name: t("workspaces.alpha.name"),
      plan: t("workspaces.alpha.plan"),
      initials: t("workspaces.alpha.initials"),
      avatarUrl: "https://api.dicebear.com/9.x/initials/svg?seed=Alpha",
      chipClassName: "bg-emerald-600 text-white hover:text-white",
    },
    {
      id: "beta",
      name: t("workspaces.beta.name"),
      plan: t("workspaces.beta.plan"),
      initials: t("workspaces.beta.initials"),
      avatarUrl: null,
      chipClassName: "bg-amber-500 text-black hover:text-black",
    },
  ];
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(workspaces[0]?.id ?? "current");
  const [failedAvatarUrls, setFailedAvatarUrls] = useState<string[]>([]);
  const activeWorkspace =
    workspaces.find((workspace) => workspace.id === activeWorkspaceId) ?? workspaces[0];
  const activeWorkspaceAvatarUrl = getWorkspaceAvatarUrl(activeWorkspace, failedAvatarUrls);

  function handleWorkspaceAvatarError(avatarUrl: string) {
    setFailedAvatarUrls((currentUrls) => {
      if (currentUrls.includes(avatarUrl)) {
        return currentUrls;
      }

      return [...currentUrls, avatarUrl];
    });
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
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
              <span className="truncate text-xs">{activeWorkspace.plan}</span>
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
              {workspaces.map((workspace) => {
                const workspaceAvatarUrl = getWorkspaceAvatarUrl(workspace, failedAvatarUrls);

                return (
                  <DropdownMenuItem
                    key={workspace.id}
                    className="gap-2 p-2"
                    onClick={() => setActiveWorkspaceId(workspace.id)}
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
                        {workspace.plan}
                      </span>
                    </div>
                    {workspace.id === activeWorkspace.id && (
                      <CheckIcon aria-hidden="true" className="size-4" />
                    )}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 p-2">
              <div className="bg-background border-border flex size-6 items-center justify-center rounded-md border">
                <PlusIcon aria-hidden="true" className="size-4" />
              </div>
              <span className="text-muted-foreground font-medium">{t("actions.create")}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

function getWorkspaceAvatarUrl(workspace: WorkspaceOption, failedAvatarUrls: string[]) {
  if (!workspace.avatarUrl) {
    return null;
  }

  return failedAvatarUrls.includes(workspace.avatarUrl) ? null : workspace.avatarUrl;
}
