"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { requestEmailVerification } from "@/features/auth/auth-client";
import { XIcon } from "lucide-react";

export function EmailVerificationBanner() {
  const t = useTranslations("layout.emailVerificationBanner");
  const [isDismissed, setIsDismissed] = useState(false);
  const [isSendingVerificationEmail, setIsSendingVerificationEmail] = useState(false);

  async function handleResendVerificationEmailClick() {
    if (isSendingVerificationEmail) {
      return;
    }

    setIsSendingVerificationEmail(true);

    const response = await requestEmailVerification();

    if (response.ok) {
      toast.success(t("status.success.title"), {
        description: t("status.success.message"),
      });
      setIsSendingVerificationEmail(false);
      return;
    }

    if (response.errorCode === "UNAUTHORIZED") {
      toast.error(t("status.error.title"), {
        description: t("status.error.unauthorized"),
      });
    } else {
      toast.error(t("status.error.title"), {
        description: t("status.error.message"),
      });
    }

    setIsSendingVerificationEmail(false);
  }

  if (isDismissed) {
    return null;
  }

  return (
    <div className="bg-amber-600 py-2.5 text-amber-100">
      <Container className="flex items-center gap-2 lg:before:flex-1">
        <div className="flex w-full flex-wrap items-center gap-2 lg:justify-center lg:text-center">
          <p className="text-sm">
            <strong>{t("title")}</strong>
          </p>
          <Button
            type="button"
            variant="link"
            size="sm"
            className="text-amber-100"
            disabled={isSendingVerificationEmail}
            onClick={handleResendVerificationEmailClick}
          >
            {t("resend")}
          </Button>
        </div>

        <div className="flex flex-1 justify-end">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setIsDismissed(true)}
            aria-label={t("close")}
          >
            <XIcon aria-hidden="true" />
          </Button>
        </div>
      </Container>
    </div>
  );
}
