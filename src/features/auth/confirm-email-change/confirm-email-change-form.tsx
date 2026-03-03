"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import { Spinner } from "@/components/ui/spinner";
import { confirmEmailChange } from "@/features/auth/auth-client";
import { AlertCircleIcon, MailCheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type SubmitErrorCode = "password-required" | "invalid-token-or-password" | "generic" | null;

export function ConfirmEmailChangeForm({
  token,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  token: string | null;
}) {
  const t = useTranslations("forms.confirmEmailChange");
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitErrorCode, setSubmitErrorCode] = useState<SubmitErrorCode>(null);
  const submitErrorMessage = getSubmitErrorMessage(submitErrorCode, t);
  const isPasswordInvalid = submitErrorCode === "password-required";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      setSubmitErrorCode("invalid-token-or-password");
      return;
    }

    if (!password.trim()) {
      setSubmitErrorCode("password-required");
      return;
    }

    setIsSubmitting(true);
    setSubmitErrorCode(null);

    const response = await confirmEmailChange({
      token,
      password,
    });

    if (response.ok) {
      if (response.data.session?.user.id) {
        router.replace("/dashboard");
        return;
      }

      router.replace("/login");
      return;
    }

    if (response.errorCode === "BAD_REQUEST" || response.errorCode === "INVALID_CREDENTIALS") {
      setSubmitErrorCode("invalid-token-or-password");
    } else {
      setSubmitErrorCode("generic");
    }

    setIsSubmitting(false);
  }

  return (
    <div {...props} className={cn("@container w-full", className)}>
      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <FieldDescription>{t("description")}</FieldDescription>

          <Field data-invalid={isPasswordInvalid}>
            <FieldLabel htmlFor="confirm-email-change-password">
              {t("fields.password.label")}
            </FieldLabel>
            <PasswordInput
              id="confirm-email-change-password"
              name="confirm-email-change-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={t("fields.password.placeholder")}
              aria-invalid={isPasswordInvalid}
              autoComplete="current-password"
              required
              showPasswordLabel={t("passwordVisibility.show")}
              hidePasswordLabel={t("passwordVisibility.hide")}
            />
            <FieldDescription>{t("fields.password.description")}</FieldDescription>
          </Field>

          <Button type="submit" disabled={isSubmitting || !token} size="lg" className="w-full">
            {isSubmitting ? <Spinner /> : <MailCheckIcon aria-hidden="true" className="size-4" />}
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
      </form>
    </div>
  );
}

function getSubmitErrorMessage(errorCode: SubmitErrorCode, t: (key: string) => string) {
  if (errorCode === "password-required") {
    return t("validation.passwordRequired");
  }

  if (errorCode === "invalid-token-or-password") {
    return t("status.error.invalidOrExpiredTokenOrPassword");
  }

  if (errorCode === "generic") {
    return t("status.error.message");
  }

  return null;
}
