"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FieldDescription, FieldGroup } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { AlertCircleIcon, CheckCircleIcon, MailCheckIcon } from "lucide-react";
import { authRedirectPaths } from "@/lib/auth-redirects";
import { readAuthFormApiResponse } from "@/lib/auth-form-api";
import { cn } from "@/lib/utils";

export function VerifyEmailForm({
  token,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  token: string | null;
}) {
  const t = useTranslations("forms.verifyEmail");
  const router = useRouter();
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
        message: t("status.error.invalidOrExpiredToken"),
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: "" });

    try {
      const response = await fetch("/api/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
        }),
      });

      const result = await readAuthFormApiResponse(response);

      if (response.ok && result?.ok) {
        setSubmitStatus({
          type: "success",
          message: t("status.success.message"),
        });
        router.replace(result.redirectTo ?? authRedirectPaths.login);
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

          <Button type="submit" disabled={isSubmitting || !token} size="lg" className="w-full">
            {isSubmitting ? <Spinner /> : <MailCheckIcon aria-hidden="true" className="size-4" />}
            {isSubmitting ? t("submit.pending") : t("submit.default")}
          </Button>

          {!token && (
            <Alert variant="destructive">
              <AlertCircleIcon aria-hidden="true" className="size-4" />
              <AlertTitle>{t("status.error.title")}</AlertTitle>
              <AlertDescription>{t("status.error.invalidOrExpiredToken")}</AlertDescription>
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
  if (errorCode === "INVALID_OR_EXPIRED_TOKEN") {
    return t("status.error.invalidOrExpiredToken");
  }

  return t("status.error.message");
}
