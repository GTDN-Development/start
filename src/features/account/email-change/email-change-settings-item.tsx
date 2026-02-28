"use client";

import { useForm } from "@tanstack/react-form";
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
} from "@/features/account/account-item";
import { useAccountProfile } from "@/features/account/account-profile-context";
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
} from "@/features/account/account-response";
import { AlertCircleIcon, CheckCircle2Icon, MailIcon } from "lucide-react";
import { resolveErrorMessage } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const emailChangeValueSchema = z.string().trim().toLowerCase().pipe(z.email());
type AccountTranslationFn = (key: string, values?: Record<string, string>) => string;
type EmailChangeFormValues = {
  newEmail: string;
  confirmed: boolean;
};

export function AccountEmailSettingsItem() {
  const t = useTranslations("pages.account");
  const { profile } = useAccountProfile();
  const [isEmailDialogOpen, setIsEmailDialogOpen] = React.useState(false);
  const [emailDialogStatus, setEmailDialogStatus] = React.useState<InlineStatus>(null);
  const normalizedCurrentEmail = profile.email.trim().toLowerCase();
  const emailChangeFormSchema = getEmailChangeFormSchema(t, normalizedCurrentEmail);
  const form = useForm({
    defaultValues: {
      newEmail: "",
      confirmed: false,
    },
    validators: {
      onSubmit: emailChangeFormSchema,
    },
    onSubmit: async ({ value }: { value: EmailChangeFormValues }) => {
      setEmailDialogStatus(null);

      const parsedValue = emailChangeFormSchema.safeParse(value);

      if (!parsedValue.success) {
        return;
      }

      const parsedEmail = emailChangeValueSchema.safeParse(value.newEmail);

      if (!parsedEmail.success) {
        return;
      }

      const normalizedNewEmail = parsedEmail.data;

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
            message: resolveErrorMessage(result?.errorCode, t("email.dialog.status.errorMessage"), {
              EMAIL_UNCHANGED: t("email.dialog.errors.sameAsCurrent"),
              INVALID_OR_UNAVAILABLE_EMAIL: t("email.dialog.errors.invalidOrUnavailable"),
              UNAUTHORIZED: t("email.dialog.errors.unauthorized"),
            }),
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
      }
    },
  });

  function clearEmailDialogStatus() {
    if (emailDialogStatus) {
      setEmailDialogStatus(null);
    }
  }

  function handleEmailDialogOpenChange(open: boolean) {
    setIsEmailDialogOpen(open);

    if (open) {
      form.reset();
      setEmailDialogStatus(null);
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
              <Badge variant={"secondary"}>{t("email.verification.verified")}</Badge>
            ) : (
              <Badge variant={"destructive"}>{t("email.verification.unverified")}</Badge>
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
            className="sm:max-w-lg"
            render={
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  form.handleSubmit();
                }}
              />
            }
          >
            <DialogHeader>
              <DialogTitle>{t("email.dialog.title")}</DialogTitle>
              <DialogDescription>{t("email.dialog.description")}</DialogDescription>
            </DialogHeader>

            <form.Subscribe
              selector={(state) => ({
                isSubmitting: state.isSubmitting,
                submissionAttempts: state.submissionAttempts,
              })}
            >
              {({ isSubmitting, submissionAttempts }) => (
                <>
                  <div className="mt-6 grid gap-4">
                    <form.Field name="newEmail">
                      {(field) => {
                        const isInvalid =
                          (field.state.meta.isTouched || submissionAttempts > 0) &&
                          !field.state.meta.isValid;

                        return (
                          <Field data-invalid={isInvalid} className="grid gap-2">
                            <FieldLabel htmlFor={`account-email-change-${field.name}`}>
                              {t("email.dialog.field.label")}
                            </FieldLabel>
                            <Input
                              id={`account-email-change-${field.name}`}
                              name={`account-email-change-${field.name}`}
                              type="email"
                              autoComplete="email"
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(event) => {
                                clearEmailDialogStatus();
                                field.handleChange(event.target.value);
                              }}
                              placeholder={t("email.dialog.field.placeholder")}
                              aria-invalid={isInvalid}
                            />
                            {isInvalid && <FieldError errors={field.state.meta.errors} />}
                          </Field>
                        );
                      }}
                    </form.Field>

                    <form.Field name="confirmed">
                      {(field) => {
                        const isInvalid =
                          (field.state.meta.isTouched || submissionAttempts > 0) &&
                          !field.state.meta.isValid;

                        return (
                          <div className="flex flex-col gap-y-2">
                            <Field orientation="horizontal" data-invalid={isInvalid}>
                              <Checkbox
                                id={`account-email-change-${field.name}`}
                                name={`account-email-change-${field.name}`}
                                checked={field.state.value}
                                onBlur={field.handleBlur}
                                onCheckedChange={(checked) => {
                                  clearEmailDialogStatus();
                                  field.handleChange(checked === true);
                                }}
                                aria-invalid={isInvalid}
                              />
                              <FieldLabel htmlFor={`account-email-change-${field.name}`}>
                                {t("email.dialog.confirmation.label")}
                              </FieldLabel>
                            </Field>
                            {isInvalid && <FieldError errors={field.state.meta.errors} />}
                          </div>
                        );
                      }}
                    </form.Field>

                    {emailDialogStatus ? (
                      emailDialogStatus.kind === "success" ? (
                        <Alert className="py-2">
                          <CheckCircle2Icon
                            aria-hidden="true"
                            className="size-4 text-emerald-500"
                          />
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
                          <Button type="button" variant="outline" size="lg">
                            {t("common.cancel")}
                          </Button>
                        }
                      />
                      <Button type="submit" disabled={isSubmitting} size="lg">
                        {isSubmitting ? (
                          <Spinner />
                        ) : (
                          <MailIcon aria-hidden="true" className="size-4" />
                        )}
                        {isSubmitting
                          ? t("email.dialog.submit.pending")
                          : t("email.dialog.submit.default")}
                      </Button>
                    </div>
                  </DialogFooter>
                </>
              )}
            </form.Subscribe>
          </DialogContent>
        </Dialog>
      </AccountItemFooter>
    </AccountItem>
  );
}

function getEmailChangeFormSchema(t: AccountTranslationFn, normalizedCurrentEmail: string) {
  return z
    .object({
      newEmail: z.string(),
      confirmed: z.boolean(),
    })
    .superRefine((value, context) => {
      const parsedNewEmail = emailChangeValueSchema.safeParse(value.newEmail);

      if (!parsedNewEmail.success) {
        context.addIssue({
          code: "custom",
          path: ["newEmail"],
          message: t("email.dialog.errors.invalidOrUnavailable"),
        });
      } else if (parsedNewEmail.data === normalizedCurrentEmail) {
        context.addIssue({
          code: "custom",
          path: ["newEmail"],
          message: t("email.dialog.errors.sameAsCurrent"),
        });
      }

      if (!value.confirmed) {
        context.addIssue({
          code: "custom",
          path: ["confirmed"],
          message: t("email.dialog.errors.confirmationRequired"),
        });
      }
    });
}
