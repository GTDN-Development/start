"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";
import { SIGN_IN_PATH, SIGN_UP_PATH } from "@/config/routes";
import { requestEmailVerificationAction } from "@/features/auth/auth-actions";
import type {
  VerifyEmailDeliveryState,
  VerifyEmailResultState,
} from "@/features/auth/verify-email/verify-email-state";
import { Spinner } from "@/components/ui/spinner";
import { AlertCircleIcon, CheckCircle2Icon, RefreshCwIcon } from "lucide-react";
import { runAsyncTransition } from "@/lib/app-utils";
import { cn } from "@/lib/utils";

type VerifyEmailFormProps = React.ComponentProps<"div"> & {
  email: string | null;
  result: VerifyEmailResultState;
  delivery: VerifyEmailDeliveryState;
};

type ResendState = "resent" | "rate_limited" | "error" | null;

export function VerifyEmailForm({
  email,
  result,
  delivery,
  className,
  ...props
}: VerifyEmailFormProps) {
  const t = useTranslations("forms.verifyEmail");

  const [resendState, setResendState] = useState<ResendState>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleResendClick() {
    if (!email || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setResendState(null);

    const response = await runAsyncTransition(() =>
      requestEmailVerificationAction({
        email,
      })
    );

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

        <div className="grid gap-3">
          {result !== "verified" && email && (
            <div className="grid gap-3">
              {delivery === "needs_resend" && result === "pending" ? (
                <div className="grid gap-1">
                  <p className="text-destructive text-sm font-medium">
                    {t("status.needsResend.title")}
                  </p>
                  <p className="text-muted-foreground text-sm">{t("status.needsResend.message")}</p>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">{t("pending.resendHint")}</p>
              )}

              <Button
                type="button"
                size="lg"
                className="w-full"
                disabled={isSubmitting}
                onClick={handleResendClick}
              >
                {isSubmitting ? (
                  <Spinner />
                ) : (
                  <RefreshCwIcon aria-hidden="true" className="size-4" />
                )}
                {isSubmitting ? t("actions.resendPending") : t("actions.resend")}
              </Button>
            </div>
          )}

          <Button
            size="lg"
            nativeButton={false}
            variant="secondary"
            className="w-full"
            render={<Link href={SIGN_IN_PATH} />}
          >
            {t("actions.signIn")}
          </Button>

          {result !== "verified" && (
            <Button
              size="lg"
              variant="secondary"
              nativeButton={false}
              className="w-full"
              render={<Link href={SIGN_UP_PATH} />}
            >
              {t("actions.signUp")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
