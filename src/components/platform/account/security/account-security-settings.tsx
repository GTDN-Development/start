"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import {
  AccountItem,
  AccountItemContent,
  AccountItemContentBody,
  AccountItemContentHeader,
  AccountItemDescription,
  AccountItemFooter,
  AccountItemTitle,
} from "@/components/platform/account/account-item";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import { Spinner } from "@/components/ui/spinner";

type PasswordApiResponse = {
  ok?: boolean;
  errorCode?: string;
  sessionExpired?: boolean;
};

type PasswordFieldErrors = {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
};

type SecurityTranslationFn = (key: string, values?: Record<string, string>) => string;

const MIN_PASSWORD_LENGTH = 8;

export function AccountSecuritySettings() {
  const t = useTranslations("pages.account");
  const tPasswordVisibility = useTranslations("forms.login.passwordVisibility");
  const router = useRouter();
  const passwordToastId = React.useId();

  const [currentPasswordValue, setCurrentPasswordValue] = React.useState("");
  const [newPasswordValue, setNewPasswordValue] = React.useState("");
  const [confirmPasswordValue, setConfirmPasswordValue] = React.useState("");
  const [fieldErrors, setFieldErrors] = React.useState<PasswordFieldErrors>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  function handleCurrentPasswordChange(event: React.ChangeEvent<HTMLInputElement>) {
    setCurrentPasswordValue(event.target.value);

    if (fieldErrors.currentPassword) {
      setFieldErrors((current) => ({
        ...current,
        currentPassword: undefined,
      }));
    }
  }

  function handleNewPasswordChange(event: React.ChangeEvent<HTMLInputElement>) {
    setNewPasswordValue(event.target.value);

    if (fieldErrors.newPassword || fieldErrors.confirmPassword) {
      setFieldErrors((current) => ({
        ...current,
        newPassword: undefined,
        confirmPassword: undefined,
      }));
    }
  }

  function handleConfirmPasswordChange(event: React.ChangeEvent<HTMLInputElement>) {
    setConfirmPasswordValue(event.target.value);

    if (fieldErrors.confirmPassword) {
      setFieldErrors((current) => ({
        ...current,
        confirmPassword: undefined,
      }));
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextFieldErrors = getPasswordFieldErrors({
      currentPassword: currentPasswordValue,
      newPassword: newPasswordValue,
      confirmPassword: confirmPasswordValue,
      t,
    });

    setFieldErrors(nextFieldErrors);

    if (Object.keys(nextFieldErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/account/password", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          oldPassword: currentPasswordValue,
          password: newPasswordValue,
          passwordConfirm: confirmPasswordValue,
        }),
      });
      const result = await readPasswordApiResponse(response);

      if (!response.ok || !result?.ok) {
        toast.error(t("common.errorTitle"), {
          id: passwordToastId,
          description: getPasswordUpdateErrorMessage(t, result?.errorCode),
        });
        return;
      }

      setCurrentPasswordValue("");
      setNewPasswordValue("");
      setConfirmPasswordValue("");
      setFieldErrors({});

      if (result.sessionExpired) {
        toast.success(t("common.successTitle"), {
          id: passwordToastId,
          description: t("security.password.status.savedAndRelogin"),
        });
        router.replace("/login");
        router.refresh();
        return;
      }

      toast.success(t("common.successTitle"), {
        id: passwordToastId,
        description: t("security.password.status.saved"),
      });
    } catch {
      toast.error(t("common.errorTitle"), {
        id: passwordToastId,
        description: t("security.password.status.error"),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-8">
      <AccountItem>
        <form onSubmit={handleSubmit}>
          <AccountItemContent className="flex flex-col gap-6">
            <AccountItemContentHeader>
              <AccountItemTitle>{t("security.password.title")}</AccountItemTitle>
              <AccountItemDescription>{t("security.password.description")}</AccountItemDescription>
            </AccountItemContentHeader>

            <AccountItemContentBody>
              <div className="grid max-w-xl gap-4">
                <Field data-invalid={Boolean(fieldErrors.currentPassword)} className="grid gap-2">
                  <FieldLabel htmlFor="account-security-current-password">
                    {t("security.password.fields.currentPassword.label")}
                  </FieldLabel>
                  <PasswordInput
                    id="account-security-current-password"
                    name="account-security-current-password"
                    autoComplete="current-password"
                    value={currentPasswordValue}
                    onChange={handleCurrentPasswordChange}
                    aria-invalid={Boolean(fieldErrors.currentPassword)}
                    showPasswordLabel={tPasswordVisibility("show")}
                    hidePasswordLabel={tPasswordVisibility("hide")}
                  />
                  {fieldErrors.currentPassword && (
                    <FieldError>{fieldErrors.currentPassword}</FieldError>
                  )}
                </Field>

                <Field data-invalid={Boolean(fieldErrors.newPassword)} className="grid gap-2">
                  <FieldLabel htmlFor="account-security-new-password">
                    {t("security.password.fields.newPassword.label")}
                  </FieldLabel>
                  <PasswordInput
                    id="account-security-new-password"
                    name="account-security-new-password"
                    autoComplete="new-password"
                    value={newPasswordValue}
                    onChange={handleNewPasswordChange}
                    aria-invalid={Boolean(fieldErrors.newPassword)}
                    showPasswordLabel={tPasswordVisibility("show")}
                    hidePasswordLabel={tPasswordVisibility("hide")}
                  />
                  {fieldErrors.newPassword && <FieldError>{fieldErrors.newPassword}</FieldError>}
                </Field>

                <Field data-invalid={Boolean(fieldErrors.confirmPassword)} className="grid gap-2">
                  <FieldLabel htmlFor="account-security-confirm-password">
                    {t("security.password.fields.confirmPassword.label")}
                  </FieldLabel>
                  <PasswordInput
                    id="account-security-confirm-password"
                    name="account-security-confirm-password"
                    autoComplete="new-password"
                    value={confirmPasswordValue}
                    onChange={handleConfirmPasswordChange}
                    aria-invalid={Boolean(fieldErrors.confirmPassword)}
                    showPasswordLabel={tPasswordVisibility("show")}
                    hidePasswordLabel={tPasswordVisibility("hide")}
                  />
                  {fieldErrors.confirmPassword && (
                    <FieldError>{fieldErrors.confirmPassword}</FieldError>
                  )}
                </Field>
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
        </form>
      </AccountItem>
    </div>
  );
}

type PasswordFieldErrorInput = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  t: SecurityTranslationFn;
};

function getPasswordFieldErrors(input: PasswordFieldErrorInput): PasswordFieldErrors {
  const errors: PasswordFieldErrors = {};

  if (!input.currentPassword.trim()) {
    errors.currentPassword = input.t("security.password.fields.currentPassword.errors.required");
  }

  if (input.newPassword.length < MIN_PASSWORD_LENGTH) {
    errors.newPassword = input.t("security.password.fields.newPassword.errors.min", {
      min: String(MIN_PASSWORD_LENGTH),
    });
  }

  if (!input.confirmPassword) {
    errors.confirmPassword = input.t("security.password.fields.confirmPassword.errors.required");
  } else if (input.newPassword !== input.confirmPassword) {
    errors.confirmPassword = input.t("security.password.fields.confirmPassword.errors.mismatch");
  }

  if (input.currentPassword && input.newPassword && input.currentPassword === input.newPassword) {
    errors.newPassword = input.t("security.password.fields.newPassword.errors.sameAsCurrent");
  }

  return errors;
}

function getPasswordUpdateErrorMessage(t: SecurityTranslationFn, errorCode?: string) {
  if (errorCode === "INVALID_PASSWORD_INPUT") {
    return t("security.password.status.invalidInput");
  }

  if (errorCode === "UNAUTHORIZED") {
    return t("security.password.status.unauthorized");
  }

  return t("security.password.status.error");
}

async function readPasswordApiResponse(response: Response): Promise<PasswordApiResponse | null> {
  try {
    const data = (await response.json()) as unknown;

    if (!isRecord(data)) {
      return null;
    }

    return {
      ok: data.ok === true ? true : undefined,
      errorCode: typeof data.errorCode === "string" ? data.errorCode : undefined,
      sessionExpired: typeof data.sessionExpired === "boolean" ? data.sessionExpired : undefined,
    };
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
