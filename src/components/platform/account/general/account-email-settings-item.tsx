"use client";

import * as React from "react";
import { z } from "zod";
import { useTranslations } from "next-intl";
import {
  AccountItem,
  AccountItemContent,
  AccountItemContentBody,
  AccountItemContentHeader,
  AccountItemDescription,
  AccountItemFooter,
  AccountItemTitle,
} from "@/components/platform/account/account-item";
import { useAccountProfile } from "@/components/shared/account/account-profile-context";
import { Button } from "@/components/ui/button";
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
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  readAccountSettingsApiResponse,
  StatusAlert,
  type InlineStatus,
  type SettingsTranslationFn,
} from "@/components/platform/account/general/account-general-settings.shared";
import { MailIcon } from "lucide-react";

const emailChangeValueSchema = z.string().trim().toLowerCase().pipe(z.email());

export function AccountEmailSettingsItem() {
  const t = useTranslations("pages.account");
  const { profile } = useAccountProfile();
  const [isEmailDialogOpen, setIsEmailDialogOpen] = React.useState(false);
  const [newEmailValue, setNewEmailValue] = React.useState("");
  const [emailFieldError, setEmailFieldError] = React.useState<string | null>(null);
  const [emailDialogStatus, setEmailDialogStatus] = React.useState<InlineStatus>(null);
  const [isSendingEmailChange, setIsSendingEmailChange] = React.useState(false);

  function handleEmailDialogOpenChange(open: boolean) {
    setIsEmailDialogOpen(open);

    if (open) {
      setNewEmailValue("");
      setEmailFieldError(null);
      setEmailDialogStatus(null);
    }
  }

  function handleEmailInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    setNewEmailValue(event.target.value);

    if (emailFieldError) {
      setEmailFieldError(null);
    }

    if (emailDialogStatus) {
      setEmailDialogStatus(null);
    }
  }

  async function handleEmailChangeSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedCurrentEmail = profile.email.trim().toLowerCase();
    const parsedNewEmail = emailChangeValueSchema.safeParse(newEmailValue);

    if (!parsedNewEmail.success) {
      setEmailFieldError(t("email.dialog.errors.invalidOrUnavailable"));
      setEmailDialogStatus(null);
      return;
    }

    const normalizedNewEmail = parsedNewEmail.data;

    if (normalizedNewEmail === normalizedCurrentEmail) {
      setEmailFieldError(t("email.dialog.errors.sameAsCurrent"));
      setEmailDialogStatus(null);
      return;
    }

    setIsSendingEmailChange(true);
    setEmailFieldError(null);
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
    <AccountItem>
      <AccountItemContent className="flex flex-col gap-6">
        <div className="flex flex-row flex-wrap gap-6 xl:gap-8">
          <AccountItemContentHeader className="w-full grow basis-72">
            <AccountItemTitle>{t("email.title")}</AccountItemTitle>
            <AccountItemDescription>{t("email.description")}</AccountItemDescription>
          </AccountItemContentHeader>

          <div className="shrink-0 basis-auto self-start">
            {profile.verified ? (
              <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                {t("email.verification.verified")}
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                {t("email.verification.unverified")}
              </span>
            )}
          </div>
        </div>

        <AccountItemContentBody>
          <p className="text-foreground text-sm font-semibold break-all">{profile.email}</p>
        </AccountItemContentBody>
      </AccountItemContent>

      <AccountItemFooter>
        <AccountItemDescription>{t("email.footerHint")}</AccountItemDescription>

        <Dialog open={isEmailDialogOpen} onOpenChange={handleEmailDialogOpenChange}>
          <DialogTrigger
            nativeButton={true}
            render={
              <Button type="button" size="lg" variant="outline">
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
                <p className="text-muted-foreground text-sm">{t("email.dialog.flowSummary")}</p>

                <Field data-invalid={Boolean(emailFieldError)} className="grid gap-2">
                  <FieldLabel htmlFor="account-email-change-new-email">
                    {t("email.dialog.field.label")}
                  </FieldLabel>
                  <Input
                    id="account-email-change-new-email"
                    name="account-email-change-new-email"
                    type="email"
                    autoComplete="email"
                    value={newEmailValue}
                    onChange={handleEmailInputChange}
                    placeholder={t("email.dialog.field.placeholder")}
                    aria-invalid={Boolean(emailFieldError)}
                    required
                  />
                  <FieldDescription>{t("email.dialog.field.description")}</FieldDescription>
                  {emailFieldError && <FieldError>{emailFieldError}</FieldError>}
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
                    nativeButton={true}
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
      </AccountItemFooter>
    </AccountItem>
  );
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
