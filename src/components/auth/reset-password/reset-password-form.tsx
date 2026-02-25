"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { AlertCircleIcon, KeyRoundIcon } from "lucide-react";
import { authRedirectPaths } from "@/features/auth/auth-redirects";
import { readAuthFormApiResponse } from "@/features/auth/auth-form-api";
import { cn } from "@/lib/utils";

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
  const [submitErrorMessage, setSubmitErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      setSubmitErrorMessage(t("status.error.invalidOrExpiredToken"));
      return;
    }

    if (password.length < 8 || confirmPassword.length < 8) {
      setSubmitErrorMessage(t("validation.password"));
      return;
    }

    if (password !== confirmPassword) {
      setSubmitErrorMessage(t("validation.passwordMismatch"));
      return;
    }

    setIsSubmitting(true);
    setSubmitErrorMessage(null);

    try {
      const response = await fetch("/api/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password,
          confirmPassword,
        }),
      });

      const result = await readAuthFormApiResponse(response);

      if (response.ok && result?.ok) {
        router.replace(result.redirectTo ?? authRedirectPaths.login);
      } else {
        setSubmitErrorMessage(getErrorMessage(t, result?.errorCode));
      }
    } catch {
      setSubmitErrorMessage(t("status.error.message"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div {...props} className={cn("@container w-full", className)}>
      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="reset-password-password">{t("fields.password.label")}</FieldLabel>
            <Input
              id="reset-password-password"
              name="reset-password-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={t("fields.password.placeholder")}
              required
              minLength={8}
              autoComplete="new-password"
            />
            <FieldDescription>{t("fields.password.description")}</FieldDescription>
          </Field>

          <Field>
            <FieldLabel htmlFor="reset-password-confirm-password">
              {t("fields.confirmPassword.label")}
            </FieldLabel>
            <Input
              id="reset-password-confirm-password"
              name="reset-password-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder={t("fields.confirmPassword.placeholder")}
              required
              minLength={8}
              autoComplete="new-password"
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

function getErrorMessage(t: (key: string) => string, errorCode?: string) {
  if (errorCode === "INVALID_OR_EXPIRED_TOKEN") {
    return t("status.error.invalidOrExpiredToken");
  }

  if (errorCode === "PASSWORD_MISMATCH") {
    return t("validation.passwordMismatch");
  }

  return t("status.error.message");
}
