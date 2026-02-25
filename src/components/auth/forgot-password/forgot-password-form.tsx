"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { AlertCircleIcon, CheckCircleIcon, MailIcon } from "lucide-react";
import { readAuthFormApiResponse } from "@/lib/auth-form-api";
import { cn } from "@/lib/utils";

export function ForgotPasswordForm({ className, ...props }: React.ComponentProps<"div">) {
  const t = useTranslations("forms.forgotPassword");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: "" });

    try {
      const response = await fetch("/api/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
        }),
      });

      const result = await readAuthFormApiResponse(response);

      if (response.ok && result?.ok) {
        setSubmitStatus({
          type: "success",
          message: t("status.success.message"),
        });
      } else {
        setSubmitStatus({
          type: "error",
          message: t("status.error.message"),
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
          <Field>
            <FieldLabel htmlFor="forgot-password-email">{t("fields.email.label")}</FieldLabel>
            <Input
              id="forgot-password-email"
              name="forgot-password-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={t("fields.email.placeholder")}
              required
              autoComplete="email"
            />
            <FieldDescription>{t("fields.email.description")}</FieldDescription>
          </Field>

          <Button type="submit" disabled={isSubmitting} size="lg" className="w-full">
            {isSubmitting ? <Spinner /> : <MailIcon aria-hidden="true" className="size-4" />}
            {isSubmitting ? t("submit.pending") : t("submit.default")}
          </Button>

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
