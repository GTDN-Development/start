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
import { confirmEmailChange } from "@/features/auth/auth-client";
import { AlertCircleIcon, MailCheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type SubmitErrorCode = "invalid-token-or-password" | "generic" | null;
type ConfirmEmailChangeFormValues = {
  password: string;
};

export function ConfirmEmailChangeForm({
  token,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  token: string | null;
}) {
  const t = useTranslations("forms.confirmEmailChange");
  const router = useRouter();
  const [submitErrorCode, setSubmitErrorCode] = useState<SubmitErrorCode>(null);
  const submitErrorMessage = getSubmitErrorMessage(submitErrorCode, t);
  const confirmEmailChangeFormSchema = z.object({
    password: z
      .string()
      .trim()
      .min(1, {
        message: t("validation.passwordRequired"),
      }),
  });

  const form = useForm({
    defaultValues: {
      password: "",
    },
    validators: {
      onSubmit: confirmEmailChangeFormSchema,
    },
    onSubmit: async ({ value }: { value: ConfirmEmailChangeFormValues }) => {
      if (!token) {
        setSubmitErrorCode("invalid-token-or-password");
        return;
      }

      setSubmitErrorCode(null);

      const response = await confirmEmailChange({
        token,
        password: value.password,
      });

      if (response.ok) {
        router.replace(SIGN_IN_PATH);
        return;
      }

      if (response.errorCode === "BAD_REQUEST") {
        setSubmitErrorCode("invalid-token-or-password");
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
              <FieldDescription>{t("description")}</FieldDescription>

              <form.Field name="password">
                {(field) => {
                  const isInvalid =
                    (field.state.meta.isTouched || submissionAttempts > 0) &&
                    !field.state.meta.isValid;

                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={`confirm-email-change-${field.name}`}>
                        {t("fields.password.label")}
                      </FieldLabel>
                      <PasswordInput
                        id={`confirm-email-change-${field.name}`}
                        name={`confirm-email-change-${field.name}`}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) => {
                          clearSubmitErrorCode();
                          field.handleChange(event.target.value);
                        }}
                        placeholder={t("fields.password.placeholder")}
                        aria-invalid={isInvalid}
                        autoComplete="current-password"
                        showPasswordLabel={t("passwordVisibility.show")}
                        hidePasswordLabel={t("passwordVisibility.hide")}
                      />
                      <FieldDescription>{t("fields.password.description")}</FieldDescription>
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  );
                }}
              </form.Field>

              <Button type="submit" disabled={isSubmitting || !token} size="lg" className="w-full">
                {isSubmitting ? (
                  <Spinner />
                ) : (
                  <MailCheckIcon aria-hidden="true" className="size-4" />
                )}
                {isSubmitting ? t("submit.pending") : t("submit.default")}
              </Button>

              {!token && (
                <Alert variant="destructive">
                  <AlertCircleIcon aria-hidden="true" className="size-4" />
                  <AlertTitle>{t("status.error.title")}</AlertTitle>
                  <AlertDescription>
                    {t("status.error.invalidOrExpiredTokenOrPassword")}
                  </AlertDescription>
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
  if (errorCode === "invalid-token-or-password") {
    return t("status.error.invalidOrExpiredTokenOrPassword");
  }

  if (errorCode === "generic") {
    return t("status.error.message");
  }

  return null;
}
