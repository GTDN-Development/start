"use client";

import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FieldDescription, FieldGroup } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { verifyEmailToken } from "@/features/auth/auth-client";
import { setAuthFlash } from "@/features/auth/auth-flash";
import { AlertCircleIcon, MailCheckIcon } from "lucide-react";
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
  const [submitErrorMessage, setSubmitErrorMessage] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {},
    onSubmit: async () => {
      if (!token) {
        setSubmitErrorMessage(t("status.error.invalidOrExpiredToken"));
        return;
      }

      setSubmitErrorMessage(null);

      const response = await verifyEmailToken(token);

      if (response.ok) {
        if (response.data.session?.user.verified) {
          router.replace("/dashboard");
          return;
        }

        setAuthFlash("email-verified");
        router.replace("/login");
        return;
      }

      if (response.errorCode === "BAD_REQUEST") {
        setSubmitErrorMessage(t("status.error.invalidOrExpiredToken"));
        return;
      }

      setSubmitErrorMessage(t("status.error.message"));
    },
  });

  return (
    <div {...props} className={cn("@container w-full", className)}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          form.handleSubmit();
        }}
      >
        <form.Subscribe selector={(state) => ({ isSubmitting: state.isSubmitting })}>
          {({ isSubmitting }) => (
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

              {submitErrorMessage && (
                <Alert variant="destructive">
                  <AlertCircleIcon aria-hidden="true" className="size-4" />
                  <AlertTitle>{t("status.error.title")}</AlertTitle>
                  <AlertDescription>{submitErrorMessage}</AlertDescription>
                </Alert>
              )}
            </FieldGroup>
          )}
        </form.Subscribe>
      </form>
    </div>
  );
}
