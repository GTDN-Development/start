"use client";

import { useForm } from "@tanstack/react-form";
import * as React from "react";
import { z } from "zod";
import { useTranslations } from "next-intl";
import type { InlineStatus } from "@/features/account/account-types";
import {
  AccountItem,
  AccountItemContent,
  AccountItemContentBody,
  AccountItemContentHeader,
  AccountItemDescription,
  AccountItemFooter,
  AccountItemTitle,
} from "@/features/account/account-item";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import { Spinner } from "@/components/ui/spinner";
import { AlertCircleIcon, CheckCircle2Icon } from "lucide-react";

type SecurityTranslationFn = (key: string, values?: Record<string, string>) => string;
type PasswordFormValues = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 100;

export function AccountChangePasswordItem() {
  const t = useTranslations("pages.account");
  const tPasswordVisibility = useTranslations("forms.login.passwordVisibility");
  const [submitStatus, setSubmitStatus] = React.useState<InlineStatus>(null);

  const passwordFormSchema = getPasswordFormSchema(t);
  const form = useForm({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    validators: {
      onSubmit: passwordFormSchema,
    },
    onSubmit: async ({ value: _value }: { value: PasswordFormValues }) => {
      setSubmitStatus(null);

      try {
        await new Promise((resolve) => setTimeout(resolve, 300));

        form.reset();

        setSubmitStatus({
          kind: "success",
          message: t("security.password.status.saved"),
        });
      } catch {
        setSubmitStatus({
          kind: "error",
          message: t("security.password.status.error"),
        });
      }
    },
  });

  function clearSubmitStatus() {
    if (submitStatus) {
      setSubmitStatus(null);
    }
  }

  return (
    <AccountItem>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          form.handleSubmit();
        }}
      >
        <form.Subscribe
          selector={(state) => ({
            isSubmitting: state.isSubmitting,
            submissionAttempts: state.submissionAttempts,
          })}
        >
          {({ isSubmitting, submissionAttempts }) => (
            <>
              <AccountItemContent className="flex flex-col gap-6">
                <AccountItemContentHeader>
                  <AccountItemTitle>{t("security.password.title")}</AccountItemTitle>
                  <AccountItemDescription>
                    {t("security.password.description")}
                  </AccountItemDescription>
                </AccountItemContentHeader>

                <AccountItemContentBody>
                  <div className="grid max-w-xl gap-4">
                    <form.Field name="currentPassword">
                      {(field) => {
                        const isInvalid =
                          (field.state.meta.isTouched || submissionAttempts > 0) &&
                          !field.state.meta.isValid;

                        return (
                          <Field data-invalid={isInvalid} className="grid gap-2">
                            <FieldLabel htmlFor={`account-password-${field.name}`}>
                              {t("security.password.fields.currentPassword.label")}
                            </FieldLabel>
                            <PasswordInput
                              id={`account-password-${field.name}`}
                              name={`account-password-${field.name}`}
                              autoComplete="current-password"
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(event) => {
                                clearSubmitStatus();
                                field.handleChange(event.target.value);
                              }}
                              aria-invalid={isInvalid}
                              showPasswordLabel={tPasswordVisibility("show")}
                              hidePasswordLabel={tPasswordVisibility("hide")}
                            />
                            {isInvalid && <FieldError errors={field.state.meta.errors} />}
                          </Field>
                        );
                      }}
                    </form.Field>

                    <form.Field name="newPassword">
                      {(field) => {
                        const isInvalid =
                          (field.state.meta.isTouched || submissionAttempts > 0) &&
                          !field.state.meta.isValid;

                        return (
                          <Field data-invalid={isInvalid} className="mt-6 grid gap-2">
                            <FieldLabel htmlFor={`account-password-${field.name}`}>
                              {t("security.password.fields.newPassword.label")}
                            </FieldLabel>
                            <PasswordInput
                              id={`account-password-${field.name}`}
                              name={`account-password-${field.name}`}
                              autoComplete="new-password"
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(event) => {
                                clearSubmitStatus();
                                field.handleChange(event.target.value);
                              }}
                              aria-invalid={isInvalid}
                              showPasswordLabel={tPasswordVisibility("show")}
                              hidePasswordLabel={tPasswordVisibility("hide")}
                            />
                            {isInvalid && <FieldError errors={field.state.meta.errors} />}
                          </Field>
                        );
                      }}
                    </form.Field>

                    <form.Field name="confirmPassword">
                      {(field) => {
                        const isInvalid =
                          (field.state.meta.isTouched || submissionAttempts > 0) &&
                          !field.state.meta.isValid;

                        return (
                          <Field data-invalid={isInvalid} className="grid gap-2">
                            <FieldLabel htmlFor={`account-password-${field.name}`}>
                              {t("security.password.fields.confirmPassword.label")}
                            </FieldLabel>
                            <PasswordInput
                              id={`account-password-${field.name}`}
                              name={`account-password-${field.name}`}
                              autoComplete="new-password"
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(event) => {
                                clearSubmitStatus();
                                field.handleChange(event.target.value);
                              }}
                              aria-invalid={isInvalid}
                              showPasswordLabel={tPasswordVisibility("show")}
                              hidePasswordLabel={tPasswordVisibility("hide")}
                            />
                            {isInvalid && <FieldError errors={field.state.meta.errors} />}
                          </Field>
                        );
                      }}
                    </form.Field>

                    {submitStatus ? (
                      submitStatus.kind === "success" ? (
                        <Alert className="py-2">
                          <CheckCircle2Icon
                            aria-hidden="true"
                            className="size-4 text-emerald-500"
                          />
                          <AlertTitle>{t("common.successTitle")}</AlertTitle>
                          <AlertDescription>{submitStatus.message}</AlertDescription>
                        </Alert>
                      ) : (
                        <Alert variant="destructive" className="py-2">
                          <AlertCircleIcon aria-hidden="true" className="size-4" />
                          <AlertTitle>{t("common.errorTitle")}</AlertTitle>
                          <AlertDescription>{submitStatus.message}</AlertDescription>
                        </Alert>
                      )
                    ) : null}
                  </div>
                </AccountItemContentBody>
              </AccountItemContent>

              <AccountItemFooter>
                <AccountItemDescription>{t("security.password.footerHint")}</AccountItemDescription>
                <Button type="submit" size="lg" disabled={isSubmitting} className="sm:self-end">
                  {isSubmitting ? <Spinner /> : null}
                  {isSubmitting
                    ? t("security.password.submit.pending")
                    : t("security.password.submit.default")}
                </Button>
              </AccountItemFooter>
            </>
          )}
        </form.Subscribe>
      </form>
    </AccountItem>
  );
}

function getPasswordFormSchema(t: SecurityTranslationFn) {
  return z
    .object({
      currentPassword: z.string(),
      newPassword: z
        .string()
        .min(MIN_PASSWORD_LENGTH, {
          message: t("security.password.fields.newPassword.errors.min", {
            min: String(MIN_PASSWORD_LENGTH),
          }),
        })
        .max(MAX_PASSWORD_LENGTH, {
          message: t("security.password.status.invalidInput"),
        }),
      confirmPassword: z.string(),
    })
    .superRefine((value, context) => {
      if (!value.currentPassword.trim()) {
        context.addIssue({
          code: "custom",
          path: ["currentPassword"],
          message: t("security.password.fields.currentPassword.errors.required"),
        });
      }

      if (!value.confirmPassword) {
        context.addIssue({
          code: "custom",
          path: ["confirmPassword"],
          message: t("security.password.fields.confirmPassword.errors.required"),
        });
      } else if (value.newPassword !== value.confirmPassword) {
        context.addIssue({
          code: "custom",
          path: ["confirmPassword"],
          message: t("security.password.fields.confirmPassword.errors.mismatch"),
        });
      }

      if (
        value.currentPassword &&
        value.newPassword &&
        value.currentPassword === value.newPassword
      ) {
        context.addIssue({
          code: "custom",
          path: ["newPassword"],
          message: t("security.password.fields.newPassword.errors.sameAsCurrent"),
        });
      }
    });
}
