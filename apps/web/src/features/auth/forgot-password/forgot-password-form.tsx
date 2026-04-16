"use client";

import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Turnstile, type TurnstileRef } from "@/components/ui/turnstile";
import { AlertCircleIcon, CheckCircleIcon, MailIcon } from "lucide-react";
import { isTurnstileEnabled } from "@/config/security";
import { requestPasswordResetAction } from "@/features/auth/auth-actions";
import { runAsyncTransition } from "@/lib/app-utils";
import { cn } from "@/lib/utils";

type ForgotPasswordFormValues = {
  email: string;
  turnstileToken: string;
};

export function ForgotPasswordForm({ className, ...props }: React.ComponentProps<"div">) {
  const t = useTranslations("forms.forgotPassword");
  const tSignInValidation = useTranslations("forms.signIn.validation");

  const turnstileRef = useRef<TurnstileRef>(null);
  const turnstileEnabled = isTurnstileEnabled();
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const forgotPasswordFormSchema = z.object({
    email: z.email({
      message: tSignInValidation("email"),
    }),
    turnstileToken: turnstileEnabled
      ? z.string().min(1, {
          message: t("validation.turnstile"),
        })
      : z.string(),
  });

  const form = useForm({
    defaultValues: {
      email: "",
      turnstileToken: "",
    },
    validators: {
      onSubmit: forgotPasswordFormSchema,
    },
    onSubmit: async ({ value }: { value: ForgotPasswordFormValues }) => {
      setSubmitStatus({ type: null, message: "" });

      const response = await runAsyncTransition(() =>
        requestPasswordResetAction(
          turnstileEnabled
            ? {
                email: value.email,
                turnstileToken: value.turnstileToken,
              }
            : {
                email: value.email,
              }
        )
      );

      if (response.ok) {
        setSubmitStatus({
          type: "success",
          message: t("status.success.message"),
        });
        form.reset();
        turnstileRef.current?.reset();
      } else {
        turnstileRef.current?.reset();
        form.setFieldValue("turnstileToken", "");

        if (response.errorCode === "TURNSTILE_VERIFICATION_FAILED") {
          setSubmitStatus({
            type: "error",
            message: t("status.error.turnstile"),
          });
          return;
        }

        if (response.errorCode === "RATE_LIMITED") {
          setSubmitStatus({
            type: "error",
            message: t("status.error.rateLimited"),
          });
          return;
        }

        setSubmitStatus({
          type: "error",
          message: t("status.error.message"),
        });
      }
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
        <form.Subscribe
          selector={(state) => ({
            isSubmitting: state.isSubmitting,
            submissionAttempts: state.submissionAttempts,
          })}
        >
          {({ isSubmitting, submissionAttempts }) => (
            <FieldGroup>
              <form.Field name="email">
                {(field) => {
                  const isInvalid =
                    (field.state.meta.isTouched || submissionAttempts > 0) &&
                    !field.state.meta.isValid;

                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={`forgot-password-${field.name}`}>
                        {t("fields.email.label")}
                      </FieldLabel>
                      <Input
                        id={`forgot-password-${field.name}`}
                        name={`forgot-password-${field.name}`}
                        type="email"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) => field.handleChange(event.target.value)}
                        placeholder={t("fields.email.placeholder")}
                        autoComplete="email"
                        aria-invalid={isInvalid}
                      />
                      <FieldDescription>{t("fields.email.description")}</FieldDescription>
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  );
                }}
              </form.Field>

              {turnstileEnabled && (
                <form.Field name="turnstileToken">
                  {(field) => {
                    const isInvalid =
                      (field.state.meta.isTouched || submissionAttempts > 0) &&
                      !field.state.meta.isValid;

                    return (
                      <Field data-invalid={isInvalid}>
                        <Turnstile
                          ref={turnstileRef}
                          onSuccess={(token: string) => field.handleChange(token)}
                          onError={() => field.handleChange("")}
                          onExpire={() => field.handleChange("")}
                        />
                        {isInvalid && <FieldError errors={field.state.meta.errors} />}
                      </Field>
                    );
                  }}
                </form.Field>
              )}

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
          )}
        </form.Subscribe>
      </form>
    </div>
  );
}
