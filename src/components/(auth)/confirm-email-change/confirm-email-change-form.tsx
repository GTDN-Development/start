"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { AlertCircleIcon, CheckCircleIcon, MailCheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type ConfirmEmailChangeApiResponse = {
  ok?: boolean;
  errorCode?: string;
  redirectTo?: string;
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
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      setSubmitStatus({
        type: "error",
        message: t("status.error.invalidOrExpiredTokenOrPassword"),
      });
      return;
    }

    if (!password.trim()) {
      setSubmitStatus({
        type: "error",
        message: t("validation.passwordRequired"),
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: "" });

    try {
      const response = await fetch("/api/confirm-email-change", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password,
        }),
      });

      const result = await readApiResponse(response);

      if (response.ok && result?.ok) {
        setSubmitStatus({
          type: "success",
          message: t("status.success.message"),
        });
        router.replace(result.redirectTo ?? "/login");
      } else {
        setSubmitStatus({
          type: "error",
          message: getErrorMessage(t, result?.errorCode),
        });
      }
    } catch {
      setSubmitStatus({
        type: "error",
        message: t("status.error.message"),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div {...props} className={cn("@container w-full", className)}>
      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <FieldDescription>{t("description")}</FieldDescription>

          <Field data-invalid={submitStatus.type === "error" && !password.trim()}>
            <FieldLabel htmlFor="confirm-email-change-password">{t("fields.password.label")}</FieldLabel>
            <Input
              id="confirm-email-change-password"
              name="confirm-email-change-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={t("fields.password.placeholder")}
              aria-invalid={submitStatus.type === "error" && !password.trim()}
              autoComplete="current-password"
              required
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
              <AlertDescription>{t("status.error.invalidOrExpiredTokenOrPassword")}</AlertDescription>
            </Alert>
          )}

          {submitStatus.type && (
            <Alert variant={submitStatus.type === "error" ? "destructive" : "default"}>
              {submitStatus.type === "success" ? (
                <CheckCircleIcon aria-hidden="true" className="size-4" />
              ) : (
                <AlertCircleIcon aria-hidden="true" className="size-4" />
              )}
              <AlertTitle>
                {submitStatus.type === "success"
                  ? t("status.success.title")
                  : t("status.error.title")}
              </AlertTitle>
              <AlertDescription>{submitStatus.message}</AlertDescription>
            </Alert>
          )}
        </FieldGroup>
      </form>
    </div>
  );
}

function getErrorMessage(t: (key: string) => string, errorCode?: string) {
  if (errorCode === "INVALID_OR_EXPIRED_TOKEN_OR_PASSWORD") {
    return t("status.error.invalidOrExpiredTokenOrPassword");
  }

  return t("status.error.message");
}

async function readApiResponse(response: Response): Promise<ConfirmEmailChangeApiResponse | null> {
  try {
    const data = (await response.json()) as unknown;

    if (typeof data !== "object" || data === null) {
      return null;
    }

    return data as ConfirmEmailChangeApiResponse;
  } catch {
    return null;
  }
}
