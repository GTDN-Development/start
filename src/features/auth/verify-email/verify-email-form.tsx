"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";
import { SIGN_IN_PATH, SIGN_UP_PATH } from "@/config/routes";
import { requestEmailVerification } from "@/features/auth/auth-client";
import type { VerifyEmailResultState } from "@/features/auth/verify-email/verify-email-state";
import { Spinner } from "@/components/ui/spinner";
import { AlertCircleIcon, CheckCircle2Icon, RefreshCwIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type VerifyEmailFormProps = React.ComponentProps<"div"> & {
  email: string | null;
  result: VerifyEmailResultState;
};

type ResendState = "resent" | "rate_limited" | "error" | null;

export function VerifyEmailForm({ email, result, className, ...props }: VerifyEmailFormProps) {
  const t = useTranslations("forms.verifyEmail");

  const [resendState, setResendState] = useState<ResendState>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleResendClick() {
    if (!email || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setResendState(null);

    const response = await requestEmailVerification({
      email,
    });

    if (response.ok) {
      setResendState("resent");
      setIsSubmitting(false);
      return;
    }

    if (response.errorCode === "RATE_LIMITED") {
      setResendState("rate_limited");
      setIsSubmitting(false);
      return;
    }

    setResendState("error");
    setIsSubmitting(false);
  }

  return (
    <div {...props} className={cn("@container w-full", className)}>
      <div className="space-y-6">
        {result === "verified" && (
          <Alert>
            <CheckCircle2Icon aria-hidden="true" className="size-4 text-emerald-600" />
            <AlertTitle>{t("status.verified.title")}</AlertTitle>
            <AlertDescription>{t("status.verified.message")}</AlertDescription>
          </Alert>
        )}

        {result === "invalid" && (
          <Alert variant="destructive">
            <AlertCircleIcon aria-hidden="true" className="size-4" />
            <AlertTitle>{t("status.invalid.title")}</AlertTitle>
            <AlertDescription>{t("status.invalid.message")}</AlertDescription>
          </Alert>
        )}

        {email && result !== "verified" && (
          <div className="rounded-lg border border-dashed px-4 py-3 text-center">
            <p className="text-muted-foreground text-sm">{t("pending.emailLabel")}</p>
            <p className="text-foreground mt-1 text-sm font-semibold break-all">{email}</p>
          </div>
        )}

        {resendState === "resent" && (
          <Alert>
            <CheckCircle2Icon aria-hidden="true" className="size-4 text-emerald-600" />
            <AlertTitle>{t("status.resent.title")}</AlertTitle>
            <AlertDescription>{t("status.resent.message")}</AlertDescription>
          </Alert>
        )}

        {resendState === "rate_limited" && (
          <Alert variant="destructive">
            <AlertCircleIcon aria-hidden="true" className="size-4" />
            <AlertTitle>{t("status.rateLimited.title")}</AlertTitle>
            <AlertDescription>{t("status.rateLimited.message")}</AlertDescription>
          </Alert>
        )}

        {resendState === "error" && (
          <Alert variant="destructive">
            <AlertCircleIcon aria-hidden="true" className="size-4" />
            <AlertTitle>{t("status.error.title")}</AlertTitle>
            <AlertDescription>{t("status.error.message")}</AlertDescription>
          </Alert>
        )}

        {result !== "verified" && email && (
          <div className="space-y-3">
            <p className="text-muted-foreground text-sm">{t("pending.resendHint")}</p>

            <Button
              type="button"
              size="lg"
              className="w-full"
              disabled={isSubmitting}
              onClick={handleResendClick}
            >
              {isSubmitting ? <Spinner /> : <RefreshCwIcon aria-hidden="true" className="size-4" />}
              {isSubmitting ? t("actions.resendPending") : t("actions.resend")}
            </Button>
          </div>
        )}

        <div
          className={cn("grid gap-3", result === "verified" ? "sm:grid-cols-1" : "sm:grid-cols-2")}
        >
          <Button
            size="lg"
            nativeButton={false}
            className="w-full"
            render={<Link href={SIGN_IN_PATH} className="w-full" />}
          >
            {t("actions.signIn")}
          </Button>

          {result !== "verified" && (
            <Button
              size="lg"
              variant="outline"
              nativeButton={false}
              className="w-full"
              render={<Link href={SIGN_UP_PATH} className="w-full" />}
            >
              {t("actions.signUp")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
