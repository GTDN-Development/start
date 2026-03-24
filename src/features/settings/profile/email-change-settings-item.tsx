"use client";

import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { requestSettingsEmailChangeAction } from "@/features/settings/actions/settings-actions";
import {
  SettingsItem,
  SettingsItemContent,
  SettingsItemContentBody,
  SettingsItemContentHeader,
  SettingsItemDescription,
  SettingsItemFooter,
  SettingsItemTitle,
} from "@/components/ui/settings-item";
import { useSettingsProfile } from "@/features/settings/settings-profile-context";
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
import type { InlineStatus } from "@/features/settings/settings-types";
import { AlertCircleIcon, CheckCircle2Icon, MailIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { runAsyncTransition } from "@/lib/app-utils";

const emailChangeValueSchema = z.string().trim().toLowerCase().pipe(z.email());
type SettingsTranslationFn = (key: string, values?: Record<string, string>) => string;
type EmailChangeFormValues = {
  newEmail: string;
  confirmed: boolean;
};

export function SettingsEmailSettingsItem() {
  const t = useTranslations("pages.settings");
  const { profile } = useSettingsProfile();

  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [emailDialogStatus, setEmailDialogStatus] = useState<InlineStatus>(null);

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

      const response = await runAsyncTransition(() =>
        requestSettingsEmailChangeAction({
          newEmail: normalizedNewEmail,
        })
      );

      if (response.ok) {
        setEmailDialogStatus({
          kind: "success",
          message: t("email.dialog.status.sentMessage", {
            email: normalizedNewEmail,
          }),
        });
        return;
      }

      if (response.errorCode === "UNAUTHORIZED") {
        setEmailDialogStatus({
          kind: "error",
          message: t("email.dialog.errors.unauthorized"),
        });
        return;
      }

      if (
        response.errorCode === "BAD_REQUEST" ||
        response.errorCode === "VALIDATION_ERROR" ||
        response.errorCode === "EMAIL_ALREADY_IN_USE"
      ) {
        setEmailDialogStatus({
          kind: "error",
          message: t("email.dialog.errors.invalidOrUnavailable"),
        });
        return;
      }

      setEmailDialogStatus({
        kind: "error",
        message: t("email.dialog.status.errorMessage"),
      });
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
    <SettingsItem>
      <SettingsItemContent className="flex flex-col gap-6">
        <div className="flex flex-row flex-wrap gap-6 xl:gap-8">
          <SettingsItemContentHeader className="w-full grow basis-72">
            <SettingsItemTitle>{t("email.title")}</SettingsItemTitle>
            <SettingsItemDescription>{t("email.description")}</SettingsItemDescription>
          </SettingsItemContentHeader>

          <div className="shrink-0 basis-auto self-start">
            {profile.verified ? (
              <Badge>{t("email.verification.verified")}</Badge>
            ) : (
              <Badge variant={"destructive"}>{t("email.verification.unverified")}</Badge>
            )}
          </div>
        </div>

        <SettingsItemContentBody>
          <p className="text-foreground text-sm font-semibold break-all">{profile.email}</p>
        </SettingsItemContentBody>
      </SettingsItemContent>

      <SettingsItemFooter>
        <SettingsItemDescription>{t("email.footerHint")}</SettingsItemDescription>

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
                            <FieldLabel htmlFor={`settings-email-change-${field.name}`}>
                              {t("email.dialog.field.label")}
                            </FieldLabel>
                            <Input
                              id={`settings-email-change-${field.name}`}
                              name={`settings-email-change-${field.name}`}
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
                                id={`settings-email-change-${field.name}`}
                                name={`settings-email-change-${field.name}`}
                                checked={field.state.value}
                                onBlur={field.handleBlur}
                                onCheckedChange={(checked) => {
                                  clearEmailDialogStatus();
                                  field.handleChange(checked === true);
                                }}
                                aria-invalid={isInvalid}
                              />
                              <FieldLabel htmlFor={`settings-email-change-${field.name}`}>
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
      </SettingsItemFooter>
    </SettingsItem>
  );
}

function getEmailChangeFormSchema(t: SettingsTranslationFn, normalizedCurrentEmail: string) {
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
