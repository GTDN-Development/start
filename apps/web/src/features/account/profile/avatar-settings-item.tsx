"use client";

import { type ChangeEvent, startTransition, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  removeAccountAvatarAction,
  uploadAccountAvatarAction,
} from "@/features/account/profile/account-profile-actions";
import { accountAvatarMaxSizeBytes } from "@/features/account/account-schemas";
import { useAccountProfile } from "@/features/account/account-profile-context";
import { emitAuthChanged } from "@/features/auth/auth-client-events";
import {
  SettingsItem,
  SettingsItemContent,
  SettingsItemContentBody,
  SettingsItemContentHeader,
  SettingsItemDescription,
  SettingsItemFooter,
  SettingsItemTitle,
} from "@/components/ui/settings-item";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { prepareAvatarUpload } from "@/lib/avatar-image-processing";
import {
  getAvatarColorClass,
  getUserInitials,
  resolveErrorMessage,
  runAsyncTransition,
} from "@/lib/app-utils";
import { cn } from "@/lib/utils";
import { PencilIcon, Trash2Icon } from "lucide-react";

export function AccountAvatarSettingsItem() {
  const t = useTranslations("pages.account");
  const { profile, setProfile, isAvatarUpdating, setIsAvatarUpdating } = useAccountProfile();
  const avatarToastId = useId();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [failedAvatarUrl, setFailedAvatarUrl] = useState<string | null>(null);

  const displayName = profile.name?.trim() ? profile.name : null;
  const initials = getUserInitials(displayName ?? profile.email);
  const avatarColorClass = getAvatarColorClass(profile.id);
  const avatarUrl =
    profile.avatarUrl && profile.avatarUrl !== failedAvatarUrl ? profile.avatarUrl : null;

  async function handleAvatarInputChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const avatarFile = input.files?.[0] ?? null;

    input.value = "";

    if (!avatarFile) {
      return;
    }

    setIsAvatarUpdating(true);

    try {
      const preparedAvatarFileResult = await prepareAvatarUpload(avatarFile, {
        maxFileSizeBytes: accountAvatarMaxSizeBytes,
      });

      if (!preparedAvatarFileResult.ok) {
        toast.error(
          resolveErrorMessage(preparedAvatarFileResult.errorCode, t("avatar.status.error"), {
            INVALID_FILE_TYPE: t("avatar.status.invalidFileType"),
            IMAGE_PROCESSING_FAILED: t("avatar.status.processingFailed"),
            FILE_TOO_LARGE: t("avatar.status.fileTooLarge"),
          }),
          {
            id: avatarToastId,
          }
        );
        return;
      }

      const avatarFormData = new FormData();
      avatarFormData.set("avatar", preparedAvatarFileResult.file);

      const response = await runAsyncTransition(() => uploadAccountAvatarAction(avatarFormData));

      if (response.ok) {
        startTransition(() => {
          setProfile(response.data);
          setFailedAvatarUrl(null);
        });
        emitAuthChanged();
        toast.success(t("avatar.status.updated"), {
          id: avatarToastId,
        });
      } else {
        toast.error(
          resolveErrorMessage(response.errorCode, t("avatar.status.error"), {
            UNAUTHORIZED: t("avatar.status.unauthorized"),
            VALIDATION_ERROR: t("avatar.status.fileTooLarge"),
          }),
          {
            id: avatarToastId,
          }
        );
      }
    } finally {
      setIsAvatarUpdating(false);
    }
  }

  async function handleAvatarRemoveClick() {
    if (isAvatarUpdating || !profile.avatarUrl) {
      return;
    }

    setIsAvatarUpdating(true);

    const response = await runAsyncTransition(() => removeAccountAvatarAction());

    if (response.ok) {
      startTransition(() => {
        setProfile(response.data);
        setFailedAvatarUrl(null);
      });
      emitAuthChanged();
      toast.success(t("avatar.status.removed"), {
        id: avatarToastId,
      });
    } else {
      toast.error(
        resolveErrorMessage(response.errorCode, t("avatar.status.error"), {
          UNAUTHORIZED: t("avatar.status.unauthorized"),
        }),
        {
          id: avatarToastId,
        }
      );
    }

    setIsAvatarUpdating(false);
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
          <SettingsItemTitle>{t("avatar.title")}</SettingsItemTitle>
          <SettingsItemDescription>{t("avatar.description")}</SettingsItemDescription>
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
                    className="group relative size-14 overflow-clip rounded-full sm:size-18"
                    aria-label={t("avatar.buttonLabel")}
                    disabled={isAvatarUpdating}
                  >
                    {isAvatarUpdating ? (
                      <Skeleton className="size-14 rounded-full sm:size-18" />
                    ) : (
                      <>
                        <Avatar className="size-14 sm:size-18">
                          {avatarUrl ? (
                            <AvatarImage
                              src={avatarUrl}
                              alt=""
                              onError={() => setFailedAvatarUrl(avatarUrl)}
                            />
                          ) : (
                            <AvatarFallback className={cn(avatarColorClass, "text-xl font-medium")}>
                              {initials}
                            </AvatarFallback>
                          )}
                        </Avatar>
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
        </SettingsItemContentBody>
      </SettingsItemContent>

      <SettingsItemFooter>
        <SettingsItemDescription>{t("avatar.hint")}</SettingsItemDescription>
      </SettingsItemFooter>
    </SettingsItem>
  );
}
