"use client";

import { type ChangeEvent, useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";
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
import { StaticPlaceholder } from "@/components/ui/static-placeholder";
import {
  WorkspaceAvatar,
  WorkspaceAvatarFallback,
  WorkspaceAvatarImage,
} from "@/features/application/new/workspace-avatar";
import { getUserInitials } from "@/lib/utils";
import { PencilIcon, Trash2Icon } from "lucide-react";

const DEFAULT_WORKSPACE_NAME = "Acme Studio";

export function WorkspaceAvatarSettingsItem() {
  const avatarToastId = useId();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const uploadedObjectUrlRef = useRef<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [failedAvatarUrl, setFailedAvatarUrl] = useState<string | null>(null);
  const [isAvatarUpdating, setIsAvatarUpdating] = useState(false);

  const initials = getUserInitials(DEFAULT_WORKSPACE_NAME);
  const workspaceAvatarUrl = avatarUrl && avatarUrl !== failedAvatarUrl ? avatarUrl : null;

  useEffect(() => {
    return () => {
      revokeObjectUrl(uploadedObjectUrlRef.current);
    };
  }, []);

  function handleAvatarInputChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const selectedFile = input.files?.[0] ?? null;

    input.value = "";

    if (!selectedFile) {
      return;
    }

    const avatarValidationErrorCode = validateAvatarFile(selectedFile);

    if (avatarValidationErrorCode) {
      toast.error("Update failed", {
        id: avatarToastId,
        description: "Please upload an image file.",
      });
      return;
    }

    setIsAvatarUpdating(true);

    try {
      const nextAvatarUrl = URL.createObjectURL(selectedFile);
      revokeObjectUrl(uploadedObjectUrlRef.current);
      uploadedObjectUrlRef.current = nextAvatarUrl;
      setAvatarUrl(nextAvatarUrl);
      setFailedAvatarUrl(null);

      toast.success("Workspace updated", {
        id: avatarToastId,
        description: "Workspace avatar was saved in this static preview.",
      });
    } finally {
      setIsAvatarUpdating(false);
    }
  }

  function handleAvatarRemoveClick() {
    if (isAvatarUpdating || !avatarUrl) {
      return;
    }

    setIsAvatarUpdating(true);

    try {
      revokeObjectUrl(uploadedObjectUrlRef.current);
      uploadedObjectUrlRef.current = null;
      setAvatarUrl(null);
      setFailedAvatarUrl(null);

      toast.success("Workspace updated", {
        id: avatarToastId,
        description: "Workspace avatar was removed in this static preview.",
      });
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
          <StaticPlaceholder />
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
                  disabled={isAvatarUpdating || !avatarUrl}
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
          Only standard image formats are supported (JPEG, PNG, WebP). Oversized images are
          optimized automatically.
        </SettingsItemDescription>
      </SettingsItemFooter>
    </SettingsItem>
  );
}

function validateAvatarFile(file: File): string | null {
  if (!file.type.startsWith("image/")) {
    return "INVALID_FILE_TYPE";
  }

  return null;
}

function revokeObjectUrl(url: string | null) {
  if (url?.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}
