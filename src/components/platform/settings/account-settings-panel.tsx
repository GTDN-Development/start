"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useAccountProfile } from "@/components/shared/account/account-profile-context";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import type { AccountProfileSnapshot } from "@/features/account/account-profile";
import { AlertCircleIcon, CheckCircle2Icon, MailIcon, PencilIcon, Trash2Icon } from "lucide-react";

type InlineStatus = {
  kind: "success" | "error";
  message: string;
} | null;

type AccountSettingsApiResponse = {
  ok?: boolean;
  errorCode?: string;
  targetEmail?: string;
  profile?: AccountProfileSnapshot;
};

type SettingsTranslationFn = (key: string, values?: Record<string, string>) => string;

export function AccountSettingsPanel() {
  const t = useTranslations("pages.settings");
  const { profile, patchProfile, isAvatarUpdating, setIsAvatarUpdating } = useAccountProfile();
  const avatarToastId = React.useId();
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [failedAvatarUrl, setFailedAvatarUrl] = React.useState<string | null>(null);

  const [nameValue, setNameValue] = React.useState(profile.name ?? "");
  const [nameStatus, setNameStatus] = React.useState<InlineStatus>(null);
  const [isSavingName, setIsSavingName] = React.useState(false);

  const [isEmailDialogOpen, setIsEmailDialogOpen] = React.useState(false);
  const [newEmailValue, setNewEmailValue] = React.useState("");
  const [emailDialogStatus, setEmailDialogStatus] = React.useState<InlineStatus>(null);
  const [isSendingEmailChange, setIsSendingEmailChange] = React.useState(false);

  const displayName = profile.name?.trim() ? profile.name : null;
  const initials = getUserInitials(displayName ?? profile.email);
  const avatarUrl =
    profile.avatarUrl && profile.avatarUrl !== failedAvatarUrl ? profile.avatarUrl : null;

  async function handleNameSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSavingName(true);
    setNameStatus(null);

    try {
      const response = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: nameValue,
        }),
      });
      const result = await readAccountSettingsApiResponse(response);

      if (!response.ok || !result?.ok || !result.profile) {
        setNameStatus({
          kind: "error",
          message: getProfileSaveErrorMessage(t, result?.errorCode),
        });
        return;
      }

      patchProfile(result.profile);
      setNameValue(result.profile.name ?? "");
      setNameStatus({
        kind: "success",
        message: t("profile.status.savedMessage"),
      });
    } catch {
      setNameStatus({
        kind: "error",
        message: t("profile.status.errorMessage"),
      });
    } finally {
      setIsSavingName(false);
    }
  }

  async function handleAvatarInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const avatarFile = input.files?.[0] ?? null;

    input.value = "";

    if (!avatarFile) {
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

  function handleEmailDialogOpenChange(open: boolean) {
    setIsEmailDialogOpen(open);

    if (open) {
      setNewEmailValue("");
      setEmailDialogStatus(null);
    }
  }

  async function handleEmailChangeSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedCurrentEmail = profile.email.trim().toLowerCase();
    const normalizedNewEmail = newEmailValue.trim().toLowerCase();

    if (!normalizedNewEmail) {
      setEmailDialogStatus({
        kind: "error",
        message: t("email.dialog.errors.invalidOrUnavailable"),
      });
      return;
    }

    if (normalizedNewEmail === normalizedCurrentEmail) {
      setEmailDialogStatus({
        kind: "error",
        message: t("email.dialog.errors.sameAsCurrent"),
      });
      return;
    }

    setIsSendingEmailChange(true);
    setEmailDialogStatus(null);

    try {
      const response = await fetch("/api/account/email-change", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          newEmail: normalizedNewEmail,
        }),
      });
      const result = await readAccountSettingsApiResponse(response);

      if (!response.ok || !result?.ok) {
        setEmailDialogStatus({
          kind: "error",
          message: getEmailChangeErrorMessage(t, result?.errorCode),
        });
        return;
      }

      setEmailDialogStatus({
        kind: "success",
        message: t("email.dialog.status.sentMessage", {
          email: result.targetEmail ?? normalizedNewEmail,
        }),
      });
    } catch {
      setEmailDialogStatus({
        kind: "error",
        message: t("email.dialog.status.errorMessage"),
      });
    } finally {
      setIsSendingEmailChange(false);
    }
  }

  return (
    <Card className="overflow-visible">
      <CardHeader className="border-b">
        <CardTitle>{t("accountCard.title")}</CardTitle>
        <CardDescription>{t("accountCard.description")}</CardDescription>
      </CardHeader>

      <CardContent className="px-0">
        <SettingsRow title={t("avatar.title")} description={t("avatar.description")}>
          <div className="grid gap-3 justify-self-start sm:justify-self-end">
            <div className="flex justify-start sm:justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-lg"
                      className="group relative"
                      aria-label={t("avatar.buttonLabel")}
                      disabled={isAvatarUpdating}
                    >
                      {isAvatarUpdating ? (
                        <Skeleton className="rounded-full" />
                      ) : (
                        <>
                          <Avatar size="lg">
                            {avatarUrl ? (
                              <AvatarImage
                                src={avatarUrl}
                                alt=""
                                onError={() => setFailedAvatarUrl(avatarUrl)}
                              />
                            ) : (
                              <AvatarFallback className="text-base font-medium">
                                {initials}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <span className="absolute inset-0 grid place-items-center rounded-full bg-black/0 transition-colors group-hover:bg-black/15 group-focus-visible:bg-black/15">
                            <PencilIcon
                              aria-hidden="true"
                              className="size-3 opacity-0 group-hover:opacity-100"
                            />
                          </span>
                        </>
                      )}
                    </Button>
                  }
                />
                <DropdownMenuContent align="end" className="w-auto min-w-56">
                  <DropdownMenuItem
                    onClick={handleAvatarChangeMenuClick}
                    disabled={isAvatarUpdating}
                  >
                    <PencilIcon aria-hidden="true" className="size-4" />
                    {t("avatar.menu.change")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleAvatarRemoveClick}
                    disabled={isAvatarUpdating || !profile.avatarUrl}
                    variant="destructive"
                  >
                    <Trash2Icon aria-hidden="true" className="size-4" />
                    {t("avatar.menu.remove")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <input
                ref={fileInputRef}
                id="account-avatar-file-input"
                type="file"
                className="sr-only"
                accept="image/*"
                onChange={handleAvatarInputChange}
                tabIndex={-1}
              />
            </div>

            <p className="text-muted-foreground text-xs sm:text-right">{t("avatar.hint")}</p>
          </div>
        </SettingsRow>

        <Separator />

        <SettingsRow title={t("email.title")} description={t("email.description")}>
          <div className="grid gap-3">
            <div className="flex flex-col gap-2 sm:items-end">
              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                <p className="text-sm font-medium break-all">{profile.email}</p>
                <EmailVerificationBadge
                  verified={profile.verified}
                  verifiedLabel={t("email.verification.verified")}
                  unverifiedLabel={t("email.verification.unverified")}
                />
              </div>

              <Dialog open={isEmailDialogOpen} onOpenChange={handleEmailDialogOpenChange}>
                <DialogTrigger
                  render={
                    <Button type="button" variant="outline">
                      {t("email.changeButton")}
                    </Button>
                  }
                />
                <DialogContent className="gap-0 p-0 sm:max-w-xl">
                  <DialogHeader className="border-b px-5 py-4">
                    <DialogTitle>{t("email.dialog.title")}</DialogTitle>
                    <DialogDescription>{t("email.dialog.description")}</DialogDescription>
                  </DialogHeader>

                  <form onSubmit={handleEmailChangeSubmit}>
                    <div className="grid gap-4 px-5 py-5">
                      <p className="text-muted-foreground text-sm">
                        {t("email.dialog.flowSummary")}
                      </p>

                      <Field
                        data-invalid={emailDialogStatus?.kind === "error"}
                        className="grid gap-2"
                      >
                        <FieldLabel htmlFor="account-email-change-new-email">
                          {t("email.dialog.field.label")}
                        </FieldLabel>
                        <Input
                          id="account-email-change-new-email"
                          name="account-email-change-new-email"
                          type="email"
                          autoComplete="email"
                          value={newEmailValue}
                          onChange={(event) => setNewEmailValue(event.target.value)}
                          placeholder={t("email.dialog.field.placeholder")}
                          aria-invalid={emailDialogStatus?.kind === "error"}
                          required
                        />
                        <FieldDescription>{t("email.dialog.field.description")}</FieldDescription>
                      </Field>

                      <StatusAlert
                        status={emailDialogStatus}
                        successTitle={t("email.dialog.status.sentTitle")}
                        errorTitle={t("common.errorTitle")}
                      />
                    </div>

                    <DialogFooter className="sm:justify-between">
                      <p className="text-muted-foreground hidden text-xs sm:block">
                        {t("email.dialog.footerNote")}
                      </p>
                      <div className="flex flex-col-reverse gap-2 sm:flex-row">
                        <DialogClose
                          render={
                            <Button type="button" variant="outline">
                              {t("common.cancel")}
                            </Button>
                          }
                        />
                        <Button type="submit" disabled={isSendingEmailChange}>
                          {isSendingEmailChange ? (
                            <Spinner />
                          ) : (
                            <MailIcon aria-hidden="true" className="size-4" />
                          )}
                          {isSendingEmailChange
                            ? t("email.dialog.submit.pending")
                            : t("email.dialog.submit.default")}
                        </Button>
                      </div>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </SettingsRow>

        <Separator />

        <SettingsRow title={t("profile.title")} description={t("profile.description")}>
          <form onSubmit={handleNameSubmit} className="grid gap-3">
            <Field data-invalid={nameStatus?.kind === "error"} className="grid gap-2">
              <FieldLabel htmlFor="account-profile-name">
                {t("profile.fields.name.label")}
              </FieldLabel>
              <Input
                id="account-profile-name"
                name="account-profile-name"
                value={nameValue}
                onChange={(event) => setNameValue(event.target.value)}
                placeholder={t("profile.fields.name.placeholder")}
                autoComplete="name"
                maxLength={80}
                aria-invalid={nameStatus?.kind === "error"}
              />
              <FieldDescription>{t("profile.fields.name.description")}</FieldDescription>
            </Field>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-muted-foreground text-xs">{t("profile.footerHint")}</p>
              <Button type="submit" disabled={isSavingName} className="sm:self-end">
                {isSavingName ? <Spinner /> : null}
                {isSavingName ? t("profile.submit.pending") : t("profile.submit.default")}
              </Button>
            </div>

            <StatusAlert
              status={nameStatus}
              successTitle={t("common.successTitle")}
              errorTitle={t("common.errorTitle")}
            />
          </form>
        </SettingsRow>
      </CardContent>
    </Card>
  );
}

type SettingsRowProps = {
  title: string;
  description: string;
  children: React.ReactNode;
};

function SettingsRow({ title, description, children }: SettingsRowProps) {
  return (
    <section className="px-4 py-5 sm:px-6">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] lg:gap-6">
        <div className="grid gap-1">
          <h2 className="text-sm font-medium">{title}</h2>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
        <div className="min-w-0">{children}</div>
      </div>
    </section>
  );
}

type EmailVerificationBadgeProps = {
  verified: boolean;
  verifiedLabel: string;
  unverifiedLabel: string;
};

function EmailVerificationBadge({
  verified,
  verifiedLabel,
  unverifiedLabel,
}: EmailVerificationBadgeProps) {
  return (
    <span
      className={
        verified
          ? "inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400"
          : "inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400"
      }
    >
      {verified ? verifiedLabel : unverifiedLabel}
    </span>
  );
}

type StatusAlertProps = {
  status: InlineStatus;
  successTitle: string;
  errorTitle: string;
};

function StatusAlert({ status, successTitle, errorTitle }: StatusAlertProps) {
  if (!status) {
    return null;
  }

  if (status.kind === "success") {
    return (
      <Alert className="py-2">
        <CheckCircle2Icon aria-hidden="true" className="size-4 text-emerald-500" />
        <AlertTitle>{successTitle}</AlertTitle>
        <AlertDescription>{status.message}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="destructive" className="py-2">
      <AlertCircleIcon aria-hidden="true" className="size-4" />
      <AlertTitle>{errorTitle}</AlertTitle>
      <AlertDescription>{status.message}</AlertDescription>
    </Alert>
  );
}

function getProfileSaveErrorMessage(t: SettingsTranslationFn, errorCode?: string) {
  if (errorCode === "UNAUTHORIZED") {
    return t("profile.status.unauthorizedMessage");
  }

  if (errorCode === "INVALID_PROFILE_INPUT") {
    return t("profile.status.invalidInputMessage");
  }

  return t("profile.status.errorMessage");
}

function getAvatarErrorMessage(t: SettingsTranslationFn, errorCode?: string) {
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

function getEmailChangeErrorMessage(t: SettingsTranslationFn, errorCode?: string) {
  if (errorCode === "EMAIL_UNCHANGED") {
    return t("email.dialog.errors.sameAsCurrent");
  }

  if (errorCode === "INVALID_OR_UNAVAILABLE_EMAIL") {
    return t("email.dialog.errors.invalidOrUnavailable");
  }

  if (errorCode === "UNAUTHORIZED") {
    return t("email.dialog.errors.unauthorized");
  }

  return t("email.dialog.status.errorMessage");
}

async function readAccountSettingsApiResponse(
  response: Response
): Promise<AccountSettingsApiResponse | null> {
  try {
    const data = (await response.json()) as unknown;

    if (!isRecord(data)) {
      return null;
    }

    return {
      ok: data.ok === true ? true : undefined,
      errorCode: typeof data.errorCode === "string" ? data.errorCode : undefined,
      targetEmail: typeof data.targetEmail === "string" ? data.targetEmail : undefined,
      profile: parseAccountProfileSnapshot(data.profile),
    };
  } catch {
    return null;
  }
}

function parseAccountProfileSnapshot(value: unknown): AccountProfileSnapshot | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const email = typeof value.email === "string" ? value.email : "";
  const name =
    typeof value.name === "string" ? (value.name.trim() ? value.name.trim() : null) : null;
  const verified = typeof value.verified === "boolean" ? value.verified : false;
  const avatarUrl =
    typeof value.avatarUrl === "string" ? (value.avatarUrl.trim() ? value.avatarUrl : null) : null;

  if (!email) {
    return undefined;
  }

  return {
    email,
    name,
    verified,
    avatarUrl,
  };
}

function getUserInitials(value: string) {
  const normalized = value.trim();

  if (!normalized) {
    return "?";
  }

  const words = normalized.split(/\s+/).filter(Boolean);

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0] ?? ""}${words[1][0] ?? ""}`.toUpperCase();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
