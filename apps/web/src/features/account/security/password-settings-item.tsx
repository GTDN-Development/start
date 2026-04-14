"use client";

import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { authConfig } from "@/config/auth";
import { SIGN_IN_PATH } from "@/config/routes";
import { updateAccountPasswordAction } from "@/features/account/security/account-security-actions";
import {
  createAccountPasswordFormSchema,
  type AccountPasswordFormValues,
} from "@/features/account/account-schemas";
import type { InlineStatus } from "@/features/account/account-types";
import { emitSignedOut } from "@/features/auth/auth-client-events";
import { useRouter } from "@/i18n/navigation";
import {
  SettingsItem,
  SettingsItemContent,
  SettingsItemContentBody,
  SettingsItemContentHeader,
  SettingsItemDescription,
  SettingsItemFooter,
  SettingsItemTitle,
} from "@/components/ui/settings-item";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import { Spinner } from "@/components/ui/spinner";
import { runAsyncTransition } from "@/lib/app-utils";
import { AlertCircleIcon } from "lucide-react";

type SecurityTranslationFn = (key: string, values?: Record<string, string>) => string;

export function AccountChangePasswordItem() {
  const t = useTranslations("pages.account");
  const tPasswordVisibility = useTranslations("forms.signIn.passwordVisibility");
  const router = useRouter();

  const [submitStatus, setSubmitStatus] = useState<InlineStatus>(null);

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
    onSubmit: async ({ value }: { value: AccountPasswordFormValues }) => {
      setSubmitStatus(null);

      const response = await runAsyncTransition(() => updateAccountPasswordAction(value));

      if (response.ok) {
        emitSignedOut();
        form.reset();
        toast.success(t("security.password.status.savedAndSignIn"));
        router.replace(SIGN_IN_PATH);
        return;
      }

      if (response.errorCode === "UNAUTHORIZED") {
        toast.error(t("security.password.status.unauthorized"));
        router.replace(SIGN_IN_PATH);
        return;
      }

      if (
        response.errorCode === "BAD_REQUEST" ||
        response.errorCode === "VALIDATION_ERROR" ||
        response.errorCode === "INVALID_CREDENTIALS" ||
        response.errorCode === "WEAK_PASSWORD"
      ) {
        setSubmitStatus({
          kind: "error",
          message: t("security.password.status.invalidInput"),
        });
        return;
      }

      setSubmitStatus({
        kind: "error",
        message: t("security.password.status.error"),
      });
    },
  });

  function clearSubmitStatus() {
    if (submitStatus) {
      setSubmitStatus(null);
    }
  }

  return (
    <SettingsItem>
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
              <SettingsItemContent className="flex flex-col gap-6">
                <SettingsItemContentHeader>
                  <SettingsItemTitle>{t("security.password.title")}</SettingsItemTitle>
                  <SettingsItemDescription>
                    {t("security.password.description")}
                  </SettingsItemDescription>
                </SettingsItemContentHeader>

                <SettingsItemContentBody>
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
                      <Alert variant="destructive" className="py-2">
                        <AlertCircleIcon aria-hidden="true" className="size-4" />
                        <AlertTitle>{t("common.errorTitle")}</AlertTitle>
                        <AlertDescription>{submitStatus.message}</AlertDescription>
                      </Alert>
                    ) : null}
                  </div>
                </SettingsItemContentBody>
              </SettingsItemContent>

              <SettingsItemFooter>
                <SettingsItemDescription>
                  {t("security.password.footerHint")}
                </SettingsItemDescription>
                <Button type="submit" size="lg" disabled={isSubmitting} className="sm:self-end">
                  {isSubmitting ? <Spinner /> : null}
                  {isSubmitting
                    ? t("security.password.submit.pending")
                    : t("security.password.submit.default")}
                </Button>
              </SettingsItemFooter>
            </>
          )}
        </form.Subscribe>
      </form>
    </SettingsItem>
  );
}

function getPasswordFormSchema(t: SecurityTranslationFn) {
  return createAccountPasswordFormSchema({
    currentPasswordRequired: t("security.password.fields.currentPassword.errors.required"),
    newPasswordMin: t("security.password.fields.newPassword.errors.min", {
      min: String(authConfig.limits.passwordMinLength),
    }),
    newPasswordMax: t("security.password.status.invalidInput"),
    newPasswordSameAsCurrent: t("security.password.fields.newPassword.errors.sameAsCurrent"),
    confirmPasswordRequired: t("security.password.fields.confirmPassword.errors.required"),
    confirmPasswordMismatch: t("security.password.fields.confirmPassword.errors.mismatch"),
  });
}
