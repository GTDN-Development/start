"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import { Spinner } from "@/components/ui/spinner";
import { AlertCircleIcon, MailCheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [submitErrorMessage, setSubmitErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      setSubmitErrorMessage(t("status.error.invalidOrExpiredTokenOrPassword"));
      return;
    }

    if (!password.trim()) {
      setSubmitErrorMessage(t("validation.passwordRequired"));
      return;
    }

    setIsSubmitting(true);
    setSubmitErrorMessage(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      router.replace("/login");
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
          <FieldDescription>{t("description")}</FieldDescription>

          <Field data-invalid={Boolean(submitErrorMessage && !password.trim())}>
            <FieldLabel htmlFor="confirm-email-change-password">
              {t("fields.password.label")}
            </FieldLabel>
            <PasswordInput
              id="confirm-email-change-password"
              name="confirm-email-change-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={t("fields.password.placeholder")}
              aria-invalid={Boolean(submitErrorMessage && !password.trim())}
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
