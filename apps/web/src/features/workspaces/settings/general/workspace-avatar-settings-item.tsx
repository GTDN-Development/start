"use client";

import { type ChangeEvent, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
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
import { workspaceConfig } from "@/config/workspace";
import type { WorkspaceSettingsWorkspace } from "@/features/workspaces/settings/workspace-settings-types";
import type { WorkspaceNavigationItem } from "@/features/workspaces/workspace-navigation-types";
import {
  WorkspaceAvatar,
  WorkspaceAvatarFallback,
  WorkspaceAvatarImage,
} from "@/features/workspaces/workspace-avatar";
import { prepareAvatarUpload } from "@/lib/avatar-image-processing";
import { getAvatarColorClass, getUserInitials, resolveErrorMessage } from "@/lib/app-utils";
import { cn } from "@/lib/utils";
import type { WorkspaceResponse } from "@/server/workspaces/workspace-types";

export function WorkspaceAvatarSettingsItem({
  workspace,
  onUpdateWorkspaceAction,
}: {
  workspace: WorkspaceSettingsWorkspace;
  onUpdateWorkspaceAction: (input: {
    name?: string;
    slug?: string;
    removeAvatar?: boolean;
    avatarFile?: File;
  }) => Promise<WorkspaceResponse<{ workspaceSlug: string; workspace: WorkspaceNavigationItem }>>;
}) {
  const t = useTranslations("pages.workspace.general.avatar");
  const tCommon = useTranslations("pages.workspace.common");

  const avatarToastId = useId();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [failedAvatarUrl, setFailedAvatarUrl] = useState<string | null>(null);
  const [isAvatarUpdating, setIsAvatarUpdating] = useState(false);
  const isReadOnly = workspace.role === "member";

  const initials = getUserInitials(workspace.name);
  const avatarColorClass = getAvatarColorClass(workspace.id);
  const workspaceAvatarUrl =
    workspace.avatarUrl && workspace.avatarUrl !== failedAvatarUrl ? workspace.avatarUrl : null;

  async function handleAvatarInputChange(event: ChangeEvent<HTMLInputElement>) {
    if (isReadOnly) {
      return;
    }

    const input = event.currentTarget;
    const selectedFile = input.files?.[0] ?? null;

    input.value = "";

    if (!selectedFile) {
      return;
    }

    setIsAvatarUpdating(true);

    try {
      const preparedAvatarFileResult = await prepareAvatarUpload(selectedFile, {
        maxFileSizeBytes: workspaceConfig.limits.avatarMaxSizeBytes,
      });

      if (!preparedAvatarFileResult.ok) {
        toast.error(
          resolveErrorMessage(preparedAvatarFileResult.errorCode, t("status.error"), {
            INVALID_FILE_TYPE: t("status.invalidFile"),
            IMAGE_PROCESSING_FAILED: t("status.processingFailed"),
            FILE_TOO_LARGE: t("status.fileTooLarge"),
          }),
          {
            id: avatarToastId,
          }
        );
        return;
      }

      const response = await onUpdateWorkspaceAction({
        avatarFile: preparedAvatarFileResult.file,
      });

      if (!response.ok) {
        toast.error(
          resolveErrorMessage(response.errorCode, t("status.error"), {
            UNAUTHORIZED: t("status.unauthorized"),
            VALIDATION_ERROR: t("status.fileTooLarge"),
          }),
          {
            id: avatarToastId,
          }
        );
        return;
      }

      setFailedAvatarUrl(null);
      toast.success(t("status.updated"), {
        id: avatarToastId,
      });
    } finally {
      setIsAvatarUpdating(false);
    }
  }

  async function handleAvatarRemoveClick() {
    if (isReadOnly || isAvatarUpdating || !workspace.avatarUrl) {
      return;
    }

    setIsAvatarUpdating(true);

    try {
      const response = await onUpdateWorkspaceAction({
        removeAvatar: true,
      });

      if (!response.ok) {
        toast.error(t("status.removeFailed"), {
          id: avatarToastId,
        });
        return;
      }

      setFailedAvatarUrl(null);
      toast.success(t("status.removed"), {
        id: avatarToastId,
      });
    } finally {
      setIsAvatarUpdating(false);
    }
  }

  function handleAvatarChangeMenuClick() {
    if (isReadOnly || isAvatarUpdating) {
      return;
    }

    fileInputRef.current?.click();
  }

  return (
    <SettingsItem disabled={isReadOnly}>
      <SettingsItemContent className="flex flex-row flex-wrap gap-6 xl:gap-8">
        <SettingsItemContentHeader className="w-full grow basis-72">
          <SettingsItemTitle>{t("title")}</SettingsItemTitle>
          <SettingsItemDescription>{t("description")}</SettingsItemDescription>
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
                    aria-label={t("buttonLabel")}
                    disabled={isAvatarUpdating || isReadOnly}
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
                            <WorkspaceAvatarFallback
                              className={cn(avatarColorClass, "text-xl font-medium sm:text-2xl")}
                            >
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
                  disabled={isAvatarUpdating || isReadOnly}
                  className="whitespace-nowrap"
                >
                  <PencilIcon aria-hidden="true" className="size-4" />
                  {t("menu.change")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleAvatarRemoveClick}
                  disabled={isAvatarUpdating || isReadOnly || !workspace.avatarUrl}
                  variant="destructive"
                  className="whitespace-nowrap"
                >
                  <Trash2Icon aria-hidden="true" className="size-4" />
                  {t("menu.remove")}
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
            disabled={isReadOnly}
            onChange={handleAvatarInputChange}
            tabIndex={-1}
          />
        </SettingsItemContentBody>
      </SettingsItemContent>

      <SettingsItemFooter>
        <SettingsItemDescription>
          {isReadOnly ? tCommon("readOnlyHint") : t("hint")}
        </SettingsItemDescription>
      </SettingsItemFooter>
    </SettingsItem>
  );
}
