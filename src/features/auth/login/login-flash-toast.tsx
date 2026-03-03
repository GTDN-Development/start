"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { consumeAuthFlash } from "@/features/auth/auth-flash";

export function LoginFlashToast() {
  const tVerifyEmail = useTranslations("forms.verifyEmail.status.success");
  const tResetPassword = useTranslations("forms.resetPassword.status.success");

  useEffect(() => {
    const flash = consumeAuthFlash();

    if (!flash) {
      return;
    }

    Promise.resolve().then(() => {
      if (flash === "email-verified") {
        toast.success(tVerifyEmail("title"), { description: tVerifyEmail("message") });
      } else if (flash === "password-reset") {
        toast.success(tResetPassword("title"), { description: tResetPassword("message") });
      }
    });
  }, [tVerifyEmail, tResetPassword]);

  return null;
}
