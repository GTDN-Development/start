"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useAccountProfile } from "@/components/shared/account/account-profile-context";
import {
  AccountItem,
  AccountItemContent,
  AccountItemContentBody,
  AccountItemContentHeader,
  AccountItemDescription,
  AccountItemFooter,
  AccountItemTitle,
} from "@/components/platform/account/account-item";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { readAccountSettingsApiResponse } from "@/components/platform/account/general/account-settings-utils";
import { getUserInitials } from "@/lib/utils";
import { PencilIcon, Trash2Icon } from "lucide-react";

const MAX_AVATAR_FILE_SIZE_BYTES = 1024 * 1024;

export function AccountAvatarSettingsItem() {
  const t = useTranslations("pages.account");
  const { profile, patchProfile, isAvatarUpdating, setIsAvatarUpdating } = useAccountProfile();
  const avatarToastId = React.useId();
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [failedAvatarUrl, setFailedAvatarUrl] = React.useState<string | null>(null);

  const displayName = profile.name?.trim() ? profile.name : null;
  const initials = getUserInitials(displayName ?? profile.email);
  const avatarUrl =
    profile.avatarUrl && profile.avatarUrl !== failedAvatarUrl ? profile.avatarUrl : null;

  async function handleAvatarInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const avatarFile = input.files?.[0] ?? null;

    input.value = "";

    if (!avatarFile) {
      return;
    }

    const avatarValidationErrorCode = validateAvatarFile(avatarFile);

    if (avatarValidationErrorCode) {
      toast.error(t("common.errorTitle"), {
        id: avatarToastId,
        description: getAvatarErrorMessage(t, avatarValidationErrorCode),
      });
      return;
    }

    setIsAvatarUpdating(true);

    try {
      const formData = new FormData();
      formData.append("avatar", avatarFile);

      const response = await fetch("/api/account/avatar", {
        method: "POST",
        body: formData,
      });
      const result = await readAccountSettingsApiResponse(response);

      if (!response.ok || !result?.ok || !result.profile) {
        toast.error(t("common.errorTitle"), {
          id: avatarToastId,
          description: getAvatarErrorMessage(t, result?.errorCode),
        });
        return;
      }

      patchProfile(result.profile);
      setFailedAvatarUrl(null);
      toast.success(t("common.successTitle"), {
        id: avatarToastId,
        description: t("avatar.status.updated"),
      });
    } catch {
      toast.error(t("common.errorTitle"), {
        id: avatarToastId,
        description: t("avatar.status.error"),
      });
    } finally {
      setIsAvatarUpdating(false);
    }
  }

  async function handleAvatarRemoveClick() {
    if (isAvatarUpdating || !profile.avatarUrl) {
      return;
    }

    setIsAvatarUpdating(true);

    try {
      const response = await fetch("/api/account/avatar", {
        method: "DELETE",
      });
      const result = await readAccountSettingsApiResponse(response);

      if (!response.ok || !result?.ok || !result.profile) {
        toast.error(t("common.errorTitle"), {
          id: avatarToastId,
          description: getAvatarErrorMessage(t, result?.errorCode),
        });
        return;
      }

      patchProfile(result.profile);
      setFailedAvatarUrl(null);
      toast.success(t("common.successTitle"), {
        id: avatarToastId,
        description: t("avatar.status.removed"),
      });
    } catch {
      toast.error(t("common.errorTitle"), {
        id: avatarToastId,
        description: t("avatar.status.error"),
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
    <AccountItem>
      <AccountItemContent className="flex flex-row flex-wrap gap-6 xl:gap-8">
        <AccountItemContentHeader className="w-full grow basis-72">
          <AccountItemTitle>{t("avatar.title")}</AccountItemTitle>
          <AccountItemDescription>{t("avatar.description")}</AccountItemDescription>
        </AccountItemContentHeader>

        <AccountItemContentBody className="shrink-0 basis-auto">
          <div className="flex justify-start sm:justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger
                nativeButton={true}
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-lg"
                    className="group relative size-14 rounded-full sm:size-20"
                    aria-label={t("avatar.buttonLabel")}
                    disabled={isAvatarUpdating}
                  >
                    {isAvatarUpdating ? (
                      <Skeleton className="size-14 rounded-full sm:size-20" />
                    ) : (
                      <>
                        <Avatar className="size-14 sm:size-20">
                          {avatarUrl ? (
                            <AvatarImage
                              src={avatarUrl}
                              alt=""
                              onError={() => setFailedAvatarUrl(avatarUrl)}
                            />
                          ) : (
                            <AvatarFallback className="text-xl font-medium">
                              {initials}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <span className="absolute inset-0 grid place-items-center rounded-full bg-black/0 transition-colors group-hover:bg-black/15 group-focus-visible:bg-black/15">
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
                  {t("avatar.menu.change")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleAvatarRemoveClick}
                  disabled={isAvatarUpdating || !profile.avatarUrl}
                  variant="destructive"
                  className="whitespace-nowrap"
                >
                  <Trash2Icon aria-hidden="true" className="size-4" />
                  {t("avatar.menu.remove")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <input
            ref={fileInputRef}
            id="account-avatar-file-input"
            type="file"
            className="sr-only"
            accept="image/*"
            onChange={handleAvatarInputChange}
            tabIndex={-1}
          />
        </AccountItemContentBody>
      </AccountItemContent>

      <AccountItemFooter>
        <AccountItemDescription>{t("avatar.hint")}</AccountItemDescription>
      </AccountItemFooter>
    </AccountItem>
  );
}

function getAvatarErrorMessage(
  t: (key: string, values?: Record<string, string>) => string,
  errorCode?: string
) {
  if (errorCode === "INVALID_FILE_TYPE") {
    return t("avatar.status.invalidFileType");
  }

  if (errorCode === "FILE_TOO_LARGE") {
    return t("avatar.status.fileTooLarge");
  }

  if (errorCode === "UNAUTHORIZED") {
    return t("avatar.status.unauthorized");
  }

  return t("avatar.status.error");
}

function validateAvatarFile(file: File): string | null {
  if (!file.type.startsWith("image/")) {
    return "INVALID_FILE_TYPE";
  }

  if (file.size > MAX_AVATAR_FILE_SIZE_BYTES) {
    return "FILE_TOO_LARGE";
  }

  return null;
}
