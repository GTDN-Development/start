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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  readAccountSettingsApiResponse,
  type InlineStatus,
} from "@/components/platform/account/general/account-settings-utils";
import { AlertCircleIcon, CheckCircle2Icon, MailIcon } from "lucide-react";

const emailChangeValueSchema = z.string().trim().toLowerCase().pipe(z.email());

export function AccountEmailSettingsItem() {
  const t = useTranslations("pages.account");
  const { profile } = useAccountProfile();
  const [isEmailDialogOpen, setIsEmailDialogOpen] = React.useState(false);
  const [newEmailValue, setNewEmailValue] = React.useState("");
  const [emailFieldError, setEmailFieldError] = React.useState<string | null>(null);
  const [emailConfirmationError, setEmailConfirmationError] = React.useState<string | null>(null);
  const [emailDialogStatus, setEmailDialogStatus] = React.useState<InlineStatus>(null);
  const [isEmailChangeConfirmed, setIsEmailChangeConfirmed] = React.useState(false);
  const [isSendingEmailChange, setIsSendingEmailChange] = React.useState(false);

  function handleEmailDialogOpenChange(open: boolean) {
    setIsEmailDialogOpen(open);

    if (open) {
      setNewEmailValue("");
      setEmailFieldError(null);
      setEmailConfirmationError(null);
      setEmailDialogStatus(null);
      setIsEmailChangeConfirmed(false);
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

  function handleEmailConfirmationChange(checked: boolean | "indeterminate") {
    setIsEmailChangeConfirmed(checked === true);

    if (emailConfirmationError) {
      setEmailConfirmationError(null);
    }

    if (emailDialogStatus) {
      setEmailDialogStatus(null);
    }
  }

  async function handleEmailChangeSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedCurrentEmail = profile.email.trim().toLowerCase();
    const parsedNewEmail = emailChangeValueSchema.safeParse(newEmailValue);
    let nextEmailFieldError: string | null = null;
    let nextEmailConfirmationError: string | null = null;

    if (!parsedNewEmail.success) {
      nextEmailFieldError = t("email.dialog.errors.invalidOrUnavailable");
    } else if (parsedNewEmail.data === normalizedCurrentEmail) {
      nextEmailFieldError = t("email.dialog.errors.sameAsCurrent");
    }

    if (!isEmailChangeConfirmed) {
      nextEmailConfirmationError = t("email.dialog.errors.confirmationRequired");
    }

    if (nextEmailFieldError || nextEmailConfirmationError) {
      setEmailFieldError(nextEmailFieldError);
      setEmailConfirmationError(nextEmailConfirmationError);
      setEmailDialogStatus(null);
      return;
    }

    if (!parsedNewEmail.success) {
      return;
    }

    const normalizedNewEmail = parsedNewEmail.data;

    setIsSendingEmailChange(true);
    setEmailFieldError(null);
    setEmailConfirmationError(null);
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
              <Button type="button" size="lg">
                {t("email.changeButton")}
              </Button>
            }
          />
          <DialogContent
            className={"sm:max-w-lg"}
            render={<form onSubmit={handleEmailChangeSubmit} />}
          >
            <DialogHeader>
              <DialogTitle>{t("email.dialog.title")}</DialogTitle>
              <DialogDescription>{t("email.dialog.description")}</DialogDescription>
            </DialogHeader>

            <div className="mt-6 grid gap-4">
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
                {emailFieldError && <FieldError>{emailFieldError}</FieldError>}
              </Field>

              <div className="flex flex-col gap-y-2">
                <Field orientation="horizontal" data-invalid={Boolean(emailConfirmationError)}>
                  <Checkbox
                    id="account-email-change-confirmed"
                    name="account-email-change-confirmed"
                    checked={isEmailChangeConfirmed}
                    onCheckedChange={handleEmailConfirmationChange}
                    aria-invalid={Boolean(emailConfirmationError)}
                    required
                  />
                  <FieldLabel htmlFor="account-email-change-confirmed">
                    {t("email.dialog.confirmation.label")}
                  </FieldLabel>
                </Field>
                {emailConfirmationError && <FieldError>{emailConfirmationError}</FieldError>}
              </div>

              {emailDialogStatus ? (
                emailDialogStatus.kind === "success" ? (
                  <Alert className="py-2">
                    <CheckCircle2Icon aria-hidden="true" className="size-4 text-emerald-500" />
                    <AlertTitle>{t("email.dialog.status.sentTitle")}</AlertTitle>
                    <AlertDescription>{emailDialogStatus.message}</AlertDescription>
                  </Alert>
                ) : (
                  <Alert variant="destructive" className="py-2">
                    <AlertCircleIcon aria-hidden="true" className="size-4" />
                    <AlertTitle>{t("common.errorTitle")}</AlertTitle>
                    <AlertDescription>{emailDialogStatus.message}</AlertDescription>
                  </Alert>
                )
              ) : null}
            </div>

            <DialogFooter>
              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <DialogClose
                  nativeButton={true}
                  render={
                    <Button type="button" variant="outline" size={"lg"}>
                      {t("common.cancel")}
                    </Button>
                  }
                />
                <Button type="submit" disabled={isSendingEmailChange} size={"lg"}>
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
          </DialogContent>
        </Dialog>
      </AccountItemFooter>
    </AccountItem>
  );
}

function getEmailChangeErrorMessage(
  t: (key: string, values?: Record<string, string>) => string,
  errorCode?: string
) {
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
