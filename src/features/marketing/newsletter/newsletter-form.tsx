"use client";

import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { startTransition, useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/components/ui/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircleIcon, AlertCircleIcon } from "lucide-react";
import { legalLinks } from "@/config/menu";
import { isTurnstileEnabled } from "@/config/security";
import { submitNewsletterFormAction } from "@/features/marketing/newsletter/newsletter-actions";
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field";
import { Turnstile, type TurnstileRef } from "@/components/ui/turnstile";

import { runAsyncTransition } from "@/lib/app-utils";
import { cn } from "@/lib/utils";

type NewsletterFormValues = {
  "newsletter-email": string;
  turnstileToken: string;
};

export function NewsletterForm({ className, ...props }: React.ComponentProps<"div">) {
  const t = useTranslations("forms.newsletter");
  const turnstileEnabled = isTurnstileEnabled();

  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });
  const turnstileRef = useRef<TurnstileRef>(null);

  const newsletterFormSchema = z.object({
    "newsletter-email": z.email({
      message: t("validation.email"),
    }),
    turnstileToken: turnstileEnabled
      ? z.string().min(1, {
          message: t("validation.turnstile"),
        })
      : z.string(),
  });
  const form = useForm({
    defaultValues: {
      "newsletter-email": "",
      turnstileToken: "",
    },
    validators: {
      onSubmit: newsletterFormSchema,
    },
    onSubmit: async ({ value }: { value: NewsletterFormValues }) => {
      setSubmitStatus({ type: null, message: "" });

      const response = await runAsyncTransition(() =>
        submitNewsletterFormAction(
          turnstileEnabled
            ? {
                email: value["newsletter-email"],
                turnstileToken: value.turnstileToken,
              }
            : {
                email: value["newsletter-email"],
              }
        )
      );

      if (response.ok) {
        startTransition(() => {
          setSubmitStatus({
            type: "success",
            message: t("status.success.message"),
          });
          form.reset();
        });
        turnstileRef.current?.reset();

        return;
      }

      setSubmitStatus({
        type: "error",
        message: t("status.error.message"),
      });
    },
  });

  return (
    <div {...props} className={cn("@container w-full", className)}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
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
              <div className="flex items-end gap-3">
                <form.Field name="newsletter-email">
                  {(field) => {
                    const isInvalid =
                      (field.state.meta.isTouched || submissionAttempts > 0) &&
                      !field.state.meta.isValid;
                    return (
                      <Field data-invalid={isInvalid} className="w-full">
                        <FieldLabel htmlFor={field.name}>{t("fields.email.label")}</FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          type="email"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={isInvalid}
                          autoComplete="email"
                          placeholder={t("fields.email.placeholder")}
                        />
                        {isInvalid && <FieldError errors={field.state.meta.errors} />}
                      </Field>
                    );
                  }}
                </form.Field>

                <Button type="submit" disabled={isSubmitting} className="hidden @sm:inline-flex">
                  {isSubmitting && <Spinner />}
                  {isSubmitting ? t("submit.pending") : t("submit.default")}
                </Button>
              </div>

              <p className="text-muted-foreground text-sm">
                {t.rich("consent", {
                  link: (chunks) => (
                    <Link
                      href={legalLinks.gdpr.href}
                      target="_blank"
                      className="underline hover:no-underline"
                    >
                      {chunks}
                    </Link>
                  ),
                })}
              </p>

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

              <Button type="submit" disabled={isSubmitting} className="w-full @sm:hidden">
                {isSubmitting && <Spinner />}
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
