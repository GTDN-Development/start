"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import { Spinner } from "@/components/ui/spinner";
import { resetPasswordWithToken } from "@/features/auth/auth-client";
import { AlertCircleIcon, KeyRoundIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type SubmitErrorCode = "invalid-token" | "password" | "password-mismatch" | "generic" | null;

export function ResetPasswordForm({
  token,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  token: string | null;
}) {
  const t = useTranslations("forms.resetPassword");
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitErrorCode, setSubmitErrorCode] = useState<SubmitErrorCode>(null);
  const submitErrorMessage = getSubmitErrorMessage(submitErrorCode, t);
  const isPasswordInvalid = submitErrorCode === "password";
  const isConfirmPasswordInvalid = submitErrorCode === "password-mismatch";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      setSubmitErrorCode("invalid-token");
      return;
    }

    if (password.length < 8 || confirmPassword.length < 8) {
      setSubmitErrorCode("password");
      return;
    }

    if (password !== confirmPassword) {
      setSubmitErrorCode("password-mismatch");
      return;
    }

    setIsSubmitting(true);
    setSubmitErrorCode(null);

    const response = await resetPasswordWithToken({
      token,
      password,
      confirmPassword,
    });

    if (response.ok) {
      router.replace("/login");
      return;
    }

    if (response.errorCode === "BAD_REQUEST") {
      setSubmitErrorCode("invalid-token");
    } else if (
      response.errorCode === "WEAK_PASSWORD" ||
      response.errorCode === "VALIDATION_ERROR"
    ) {
      setSubmitErrorCode("password");
    } else {
      setSubmitErrorCode("generic");
    }

    setIsSubmitting(false);
  }

  return (
    <div {...props} className={cn("@container w-full", className)}>
      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <Field data-invalid={isPasswordInvalid}>
            <FieldLabel htmlFor="reset-password-password">{t("fields.password.label")}</FieldLabel>
            <PasswordInput
              id="reset-password-password"
              name="reset-password-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={t("fields.password.placeholder")}
              required
              minLength={8}
              autoComplete="new-password"
              aria-invalid={isPasswordInvalid}
              showPasswordLabel={t("passwordVisibility.show")}
              hidePasswordLabel={t("passwordVisibility.hide")}
            />
            <FieldDescription>{t("fields.password.description")}</FieldDescription>
          </Field>

          <Field data-invalid={isConfirmPasswordInvalid}>
            <FieldLabel htmlFor="reset-password-confirm-password">
              {t("fields.confirmPassword.label")}
            </FieldLabel>
            <PasswordInput
              id="reset-password-confirm-password"
              name="reset-password-confirm-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder={t("fields.confirmPassword.placeholder")}
              required
              minLength={8}
              autoComplete="new-password"
              aria-invalid={isConfirmPasswordInvalid}
              showPasswordLabel={t("passwordVisibility.show")}
              hidePasswordLabel={t("passwordVisibility.hide")}
            />
          </Field>

          <Button type="submit" disabled={isSubmitting || !token} size="lg" className="w-full">
            {isSubmitting ? <Spinner /> : <KeyRoundIcon aria-hidden="true" className="size-4" />}
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

  if (errorCode === "password-mismatch") {
    return t("validation.passwordMismatch");
  }

  if (errorCode === "generic") {
    return t("status.error.message");
  }

  return null;
}
