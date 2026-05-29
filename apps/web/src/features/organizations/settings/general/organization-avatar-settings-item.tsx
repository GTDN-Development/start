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
import { organizationConfig } from "@/config/organization";
import type { OrganizationSettingsOrganization } from "@/features/organizations/settings/organization-settings-types";
import type { OrganizationNavigationItem } from "@/features/organizations/organization-navigation-types";
import {
  OrganizationAvatar,
  OrganizationAvatarFallback,
  OrganizationAvatarImage,
} from "@/features/organizations/organization-avatar";
import { prepareAvatarUpload } from "@/lib/avatar-image-processing";
import { getAvatarColorClass, getUserInitials, resolveErrorMessage } from "@/lib/app-utils";
import { cn } from "@/lib/utils";
import type { OrganizationResponse } from "@/features/organizations/organization-types";

export function OrganizationAvatarSettingsItem({
  organization,
  onUpdateOrganizationAction,
}: {
  organization: OrganizationSettingsOrganization;
  onUpdateOrganizationAction: (input: {
    name?: string;
    slug?: string;
    removeAvatar?: boolean;
    avatarFile?: File;
  }) => Promise<
    OrganizationResponse<{ organizationSlug: string; organization: OrganizationNavigationItem }>
  >;
}) {
  const t = useTranslations("pages.organization.general.avatar");
  const tCommon = useTranslations("pages.organization.common");
  const avatarToastId = useId();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isAvatarUpdating, setIsAvatarUpdating] = useState(false);
  const [failedAvatarUrl, setFailedAvatarUrl] = useState<string | null>(null);
  const isReadOnly = organization.role === "member";
  const organizationAvatarUrl =
    organization.avatarUrl && organization.avatarUrl !== failedAvatarUrl
      ? organization.avatarUrl
      : null;

  async function handleAvatarInputChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.currentTarget.files?.[0] ?? null;
    event.currentTarget.value = "";

    if (isReadOnly || !selectedFile) {
      return;
    }

    setIsAvatarUpdating(true);

    try {
      const preparedAvatarFileResult = await prepareAvatarUpload(selectedFile, {
        maxFileSizeBytes: organizationConfig.limits.avatarMaxSizeBytes,
        allowedMimeTypes: organizationConfig.avatar.allowedMimeTypes,
      });

      if (!preparedAvatarFileResult.ok) {
        showAvatarError(
          resolveErrorMessage(preparedAvatarFileResult.errorCode, t("status.error"), {
            INVALID_FILE_TYPE: t("status.invalidFileType"),
            IMAGE_PROCESSING_FAILED: t("status.processingFailed"),
            FILE_TOO_LARGE: t("status.fileTooLarge"),
          })
        );
        return;
      }

      await updateAvatar({ avatarFile: preparedAvatarFileResult.file }, t("status.updated"));
    } finally {
      setIsAvatarUpdating(false);
    }
  }

  async function handleAvatarRemoveClick() {
    if (isReadOnly || isAvatarUpdating || !organization.avatarUrl) {
      return;
    }

    setIsAvatarUpdating(true);

    try {
      await updateAvatar({ removeAvatar: true }, t("status.removed"), t("status.removeFailed"));
    } finally {
      setIsAvatarUpdating(false);
    }
  }

  async function updateAvatar(
    input: { removeAvatar?: true; avatarFile?: File },
    successMessage: string,
    errorMessage = t("status.error")
  ) {
    const response = await onUpdateOrganizationAction(input);

    if (!response.ok) {
      showAvatarError(
        resolveErrorMessage(response.errorCode, errorMessage, {
          UNAUTHORIZED: t("status.unauthorized"),
          VALIDATION_ERROR: t("status.fileTooLarge"),
        })
      );
      return;
    }

    setFailedAvatarUrl(null);
    toast.success(successMessage, { id: avatarToastId });
  }

  function showAvatarError(message: string) {
    toast.error(message, { id: avatarToastId });
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
                        <OrganizationAvatar
                          key={getOrganizationAvatarStateKey(organization, organizationAvatarUrl)}
                          className="size-14 rounded-md sm:size-18"
                        >
                          {organizationAvatarUrl ? (
                            <OrganizationAvatarImage
                              src={organizationAvatarUrl}
                              alt=""
                              onError={() => setFailedAvatarUrl(organizationAvatarUrl)}
                            />
                          ) : (
                            <OrganizationAvatarFallback
                              className={cn(
                                getAvatarColorClass(organization.id),
                                "text-xl font-medium sm:text-2xl"
                              )}
                            >
                              {getUserInitials(organization.name)}
                            </OrganizationAvatarFallback>
                          )}
                        </OrganizationAvatar>
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
                  disabled={isAvatarUpdating || isReadOnly || !organization.avatarUrl}
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
            id="organization-avatar-file-input"
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

function getOrganizationAvatarStateKey(
  organization: OrganizationSettingsOrganization,
  avatarUrl: string | null
) {
  return `${organization.id}:${avatarUrl ?? "fallback"}`;
}
