"use client";

import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { SIGN_IN_PATH } from "@/config/routes";
import { useRouter } from "@/i18n/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import { Spinner } from "@/components/ui/spinner";
import { resetPasswordWithToken } from "@/features/auth/auth-client";
import { authPasswordSchema } from "@/lib/schemas";
import { AlertCircleIcon, KeyRoundIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type SubmitErrorCode = "invalid-token" | "password" | "generic" | null;
type ResetPasswordFormValues = {
  password: string;
  confirmPassword: string;
};

export function ResetPasswordForm({
  token,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  token: string | null;
}) {
  const t = useTranslations("forms.resetPassword");
  const router = useRouter();

  const [submitErrorCode, setSubmitErrorCode] = useState<SubmitErrorCode>(null);
  const submitErrorMessage = getSubmitErrorMessage(submitErrorCode, t);

  const resetPasswordFormSchema = z
    .object({
      password: authPasswordSchema({
        min: t("validation.password"),
      }),
      confirmPassword: authPasswordSchema({
        min: t("validation.password"),
      }),
    })
    .superRefine((values, context) => {
      if (values.password !== values.confirmPassword) {
        context.addIssue({
          code: "custom",
          path: ["confirmPassword"],
          message: t("validation.passwordMismatch"),
        });
      }
    });

  const form = useForm({
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
    validators: {
      onSubmit: resetPasswordFormSchema,
    },
    onSubmit: async ({ value }: { value: ResetPasswordFormValues }) => {
      if (!token) {
        setSubmitErrorCode("invalid-token");
        return;
      }

      setSubmitErrorCode(null);

      const response = await resetPasswordWithToken({
        token,
        password: value.password,
        confirmPassword: value.confirmPassword,
      });

      if (response.ok) {
        router.replace(SIGN_IN_PATH);
        return;
      }

      if (response.errorCode === "BAD_REQUEST") {
        setSubmitErrorCode("invalid-token");
        return;
      }

      if (response.errorCode === "WEAK_PASSWORD" || response.errorCode === "VALIDATION_ERROR") {
        setSubmitErrorCode("password");
        return;
      }

      setSubmitErrorCode("generic");
    },
  });

  function clearSubmitErrorCode() {
    if (submitErrorCode) {
      setSubmitErrorCode(null);
    }
  }

  return (
    <div {...props} className={cn("@container w-full", className)}>
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
            <FieldGroup>
              <form.Field name="password">
                {(field) => {
                  const hasFieldError =
                    (field.state.meta.isTouched || submissionAttempts > 0) &&
                    !field.state.meta.isValid;
                  const isInvalid = hasFieldError || submitErrorCode === "password";

                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={`reset-password-${field.name}`}>
                        {t("fields.password.label")}
                      </FieldLabel>
                      <PasswordInput
                        id={`reset-password-${field.name}`}
                        name={`reset-password-${field.name}`}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) => {
                          clearSubmitErrorCode();
                          field.handleChange(event.target.value);
                        }}
                        placeholder={t("fields.password.placeholder")}
                        autoComplete="new-password"
                        aria-invalid={isInvalid}
                        showPasswordLabel={t("passwordVisibility.show")}
                        hidePasswordLabel={t("passwordVisibility.hide")}
                      />
                      <FieldDescription>{t("fields.password.description")}</FieldDescription>
                      {hasFieldError && <FieldError errors={field.state.meta.errors} />}
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
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={`reset-password-${field.name}`}>
                        {t("fields.confirmPassword.label")}
                      </FieldLabel>
                      <PasswordInput
                        id={`reset-password-${field.name}`}
                        name={`reset-password-${field.name}`}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) => {
                          clearSubmitErrorCode();
                          field.handleChange(event.target.value);
                        }}
                        placeholder={t("fields.confirmPassword.placeholder")}
                        autoComplete="new-password"
                        aria-invalid={isInvalid}
                        showPasswordLabel={t("passwordVisibility.show")}
                        hidePasswordLabel={t("passwordVisibility.hide")}
                      />
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  );
                }}
              </form.Field>

              <Button type="submit" disabled={isSubmitting || !token} size="lg" className="w-full">
                {isSubmitting ? (
                  <Spinner />
                ) : (
                  <KeyRoundIcon aria-hidden="true" className="size-4" />
                )}
                {isSubmitting ? t("submit.pending") : t("submit.default")}
              </Button>

              {!token && (
                <Alert variant="destructive">
                  <AlertCircleIcon aria-hidden="true" className="size-4" />
                  <AlertTitle>{t("status.error.title")}</AlertTitle>
                  <AlertDescription>{t("status.error.invalidOrExpiredToken")}</AlertDescription>
                </Alert>
              )}

              {submitErrorMessage && (
                <Alert variant="destructive">
                  <AlertCircleIcon aria-hidden="true" className="size-4" />
                  <AlertTitle>{t("status.error.title")}</AlertTitle>
                  <AlertDescription>{submitErrorMessage}</AlertDescription>
                </Alert>
              )}
            </FieldGroup>
          )}
        </form.Subscribe>
      </form>
    </div>
  );
}

function getSubmitErrorMessage(errorCode: SubmitErrorCode, t: (key: string) => string) {
  if (errorCode === "invalid-token") {
    return t("status.error.invalidOrExpiredToken");
  }

  if (errorCode === "password") {
    return t("validation.password");
  }

  if (errorCode === "generic") {
    return t("status.error.message");
  }

  return null;
}
