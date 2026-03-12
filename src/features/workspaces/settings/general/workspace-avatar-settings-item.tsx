"use client";

import { type ChangeEvent, useId, useRef, useState } from "react";
import { toast } from "sonner";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SettingsItem,
  SettingsItemContent,
  SettingsItemContentBody,
  SettingsItemContentHeader,
  SettingsItemDescription,
  SettingsItemFooter,
  SettingsItemTitle,
} from "@/components/ui/settings-item";
import { Skeleton } from "@/components/ui/skeleton";
import { updateWorkspaceGeneralAction } from "@/features/workspaces/actions/workspace-actions";
import type { WorkspaceSettingsWorkspace } from "@/features/workspaces/settings/workspace-settings-types";
import {
  WorkspaceAvatar,
  WorkspaceAvatarFallback,
  WorkspaceAvatarImage,
} from "@/features/workspaces/workspace-avatar";
import { useRouter } from "@/i18n/navigation";
import { getUserInitials } from "@/lib/utils";

const MAX_WORKSPACE_AVATAR_SIZE_BYTES = 1024 * 1024;

export function WorkspaceAvatarSettingsItem({ workspace }: { workspace: WorkspaceSettingsWorkspace }) {
  const router = useRouter();
  const avatarToastId = useId();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [failedAvatarUrl, setFailedAvatarUrl] = useState<string | null>(null);
  const [isAvatarUpdating, setIsAvatarUpdating] = useState(false);

  const initials = getUserInitials(workspace.name);
  const workspaceAvatarUrl =
    workspace.avatarUrl && workspace.avatarUrl !== failedAvatarUrl ? workspace.avatarUrl : null;

  async function handleAvatarInputChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const selectedFile = input.files?.[0] ?? null;

    input.value = "";

    if (!selectedFile) {
      return;
    }

    if (!isAvatarFileValid(selectedFile)) {
      toast.error("Update failed", {
        id: avatarToastId,
        description: "Please upload a valid image up to 1 MB.",
      });
      return;
    }

    setIsAvatarUpdating(true);

    try {
      const response = await updateWorkspaceGeneralAction(workspace.slug, {
        avatarFile: selectedFile,
      });

      if (!response.ok) {
        toast.error("Update failed", {
          id: avatarToastId,
          description: "Workspace avatar could not be updated.",
        });
        return;
      }

      toast.success("Workspace updated", {
        id: avatarToastId,
        description: "Workspace avatar was updated.",
      });
      setFailedAvatarUrl(null);
      router.refresh();
    } finally {
      setIsAvatarUpdating(false);
    }
  }

  async function handleAvatarRemoveClick() {
    if (isAvatarUpdating || !workspace.avatarUrl) {
      return;
    }

    setIsAvatarUpdating(true);

    try {
      const response = await updateWorkspaceGeneralAction(workspace.slug, {
        removeAvatar: true,
      });

      if (!response.ok) {
        toast.error("Update failed", {
          id: avatarToastId,
          description: "Workspace avatar could not be removed.",
        });
        return;
      }

      toast.success("Workspace updated", {
        id: avatarToastId,
        description: "Workspace avatar was removed.",
      });
      setFailedAvatarUrl(null);
      router.refresh();
    } finally {
      setIsAvatarUpdating(false);
    }
  }

  function handleAvatarChangeMenuClick() {
    if (isAvatarUpdating) {
      return;
    }

    fileInputRef.current?.click();
  }

  return (
    <SettingsItem>
      <SettingsItemContent className="flex flex-row flex-wrap gap-6 xl:gap-8">
        <SettingsItemContentHeader className="w-full grow basis-72">
          <SettingsItemTitle>Workspace avatar</SettingsItemTitle>
          <SettingsItemDescription>
            Upload a square avatar for this workspace.
          </SettingsItemDescription>
        </SettingsItemContentHeader>

        <SettingsItemContentBody className="shrink-0 basis-auto">
          <div className="flex justify-start sm:justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger
                nativeButton={true}
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-lg"
                    className="group relative size-14 overflow-clip rounded-md sm:size-18"
                    aria-label="Change workspace avatar"
                    disabled={isAvatarUpdating}
                  >
                    {isAvatarUpdating ? (
                      <Skeleton className="size-14 rounded-md sm:size-18" />
                    ) : (
                      <>
                        <WorkspaceAvatar className="size-14 rounded-md sm:size-18">
                          {workspaceAvatarUrl ? (
                            <WorkspaceAvatarImage
                              src={workspaceAvatarUrl}
                              alt=""
                              onError={() => setFailedAvatarUrl(workspaceAvatarUrl)}
                            />
                          ) : (
                            <WorkspaceAvatarFallback className="text-xl font-medium sm:text-2xl">
                              {initials}
                            </WorkspaceAvatarFallback>
                          )}
                        </WorkspaceAvatar>
                        <span className="absolute inset-0 grid place-items-center bg-black/0 transition-colors group-hover:bg-black/15 group-focus-visible:bg-black/15">
                          <PencilIcon
                            aria-hidden="true"
                            className="size-4 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                          />
                        </span>
                      </>
                    )}
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-auto min-w-44">
                <DropdownMenuItem
                  onClick={handleAvatarChangeMenuClick}
                  disabled={isAvatarUpdating}
                  className="whitespace-nowrap"
                >
                  <PencilIcon aria-hidden="true" className="size-4" />
                  Change avatar
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleAvatarRemoveClick}
                  disabled={isAvatarUpdating || !workspace.avatarUrl}
                  variant="destructive"
                  className="whitespace-nowrap"
                >
                  <Trash2Icon aria-hidden="true" className="size-4" />
                  Remove avatar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <input
            ref={fileInputRef}
            id="workspace-avatar-file-input"
            type="file"
            className="sr-only"
            accept="image/*"
            onChange={handleAvatarInputChange}
            tabIndex={-1}
          />
        </SettingsItemContentBody>
      </SettingsItemContent>

      <SettingsItemFooter>
        <SettingsItemDescription>
          Only standard image formats are supported (JPEG, PNG, WebP).
        </SettingsItemDescription>
      </SettingsItemFooter>
    </SettingsItem>
  );
}

function isAvatarFileValid(file: File): boolean {
  if (!file.type.startsWith("image/")) {
    return false;
  }

  if (file.size > MAX_WORKSPACE_AVATAR_SIZE_BYTES) {
    return false;
  }

  return true;
}
