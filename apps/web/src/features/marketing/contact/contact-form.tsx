"use client";

import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { startTransition, useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/components/ui/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircleIcon, AlertCircleIcon } from "lucide-react";
import { legalLinks } from "@/config/menu";
import { isTurnstileEnabled } from "@/config/security";
import { submitContactFormAction } from "@/features/marketing/contact/contact-actions";
import { Field, FieldLabel, FieldDescription, FieldError, FieldGroup } from "@/components/ui/field";
import { Turnstile, type TurnstileRef } from "@/components/ui/turnstile";
import { Spinner } from "@/components/ui/spinner";

import { runAsyncTransition } from "@/lib/app-utils";
import { cn } from "@/lib/utils";

type ContactFormValues = {
  fullName: string;
  email: string;
  phone: string;
  message: string;
  gdprConsent: boolean;
  turnstileToken: string;
};

export function ContactForm({ className, ...props }: React.ComponentProps<"div">) {
  const t = useTranslations("forms.contact");
  const turnstileEnabled = isTurnstileEnabled();

  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });
  const turnstileRef = useRef<TurnstileRef>(null);

  const contactFormSchema = z.object({
    fullName: z
      .string()
      .min(3, {
        message: t("validation.fullNameMin"),
      })
      .max(100, {
        message: t("validation.fullNameMax"),
      }),
    email: z.email({
      message: t("validation.email"),
    }),
    phone: z
      .string()
      .min(9, {
        message: t("validation.phoneMin"),
      })
      .regex(/^[+]?[0-9\s\-()]+$/, {
        message: t("validation.phoneInvalid"),
      }),
    message: z
      .string()
      .min(10, {
        message: t("validation.messageMin"),
      })
      .max(1000, {
        message: t("validation.messageMax"),
      }),
    gdprConsent: z.boolean().refine((value) => value === true, {
      message: t("validation.gdprConsent"),
    }),
    turnstileToken: turnstileEnabled
      ? z.string().min(1, {
          message: t("validation.turnstile"),
        })
      : z.string(),
  });
  const form = useForm({
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      message: "",
      gdprConsent: false,
      turnstileToken: "",
    },
    validators: {
      onSubmit: contactFormSchema,
    },
    onSubmit: async ({ value }: { value: ContactFormValues }) => {
      setSubmitStatus({ type: null, message: "" });

      const response = await runAsyncTransition(() =>
        submitContactFormAction(turnstileEnabled ? value : { ...value, turnstileToken: undefined })
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
              <form.Field name="fullName">
                {(field) => {
                  const isInvalid =
                    (field.state.meta.isTouched || submissionAttempts > 0) &&
                    !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={`contact-${field.name}`}>
                        {t("fields.fullName.label")}
                      </FieldLabel>
                      <Input
                        id={`contact-${field.name}`}
                        name={`contact-${field.name}`}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        autoComplete="name"
                        placeholder={t("fields.fullName.placeholder")}
                      />
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  );
                }}
              </form.Field>

              <form.Field name="email">
                {(field) => {
                  const isInvalid =
                    (field.state.meta.isTouched || submissionAttempts > 0) &&
                    !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={`contact-${field.name}`}>
                        {t("fields.email.label")}
                      </FieldLabel>
                      <Input
                        id={`contact-${field.name}`}
                        name={`contact-${field.name}`}
                        type="email"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        autoComplete="email"
                        placeholder={t("fields.email.placeholder")}
                      />
                      <FieldDescription>{t("fields.email.description")}</FieldDescription>
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  );
                }}
              </form.Field>

              <form.Field name="phone">
                {(field) => {
                  const isInvalid =
                    (field.state.meta.isTouched || submissionAttempts > 0) &&
                    !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={`contact-${field.name}`}>
                        {t("fields.phone.label")}
                      </FieldLabel>
                      <Input
                        id={`contact-${field.name}`}
                        name={`contact-${field.name}`}
                        type="tel"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        autoComplete="tel"
                        placeholder={t("fields.phone.placeholder")}
                      />
                      <FieldDescription>{t("fields.phone.description")}</FieldDescription>
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  );
                }}
              </form.Field>

              <form.Field name="message">
                {(field) => {
                  const isInvalid =
                    (field.state.meta.isTouched || submissionAttempts > 0) &&
                    !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={`contact-${field.name}`}>
                        {t("fields.message.label")}
                      </FieldLabel>
                      <Textarea
                        id={`contact-${field.name}`}
                        name={`contact-${field.name}`}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        placeholder={t("fields.message.placeholder")}
                        rows={4}
                      />
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  );
                }}
              </form.Field>

              <form.Field name="gdprConsent">
                {(field) => {
                  const isInvalid =
                    (field.state.meta.isTouched || submissionAttempts > 0) &&
                    !field.state.meta.isValid;
                  return (
                    <div className="flex flex-col gap-y-2">
                      <Field orientation="horizontal" data-invalid={isInvalid}>
                        <Checkbox
                          id={`contact-${field.name}`}
                          name={`contact-${field.name}`}
                          checked={field.state.value}
                          onCheckedChange={(checked) => field.handleChange(checked === true)}
                          aria-invalid={isInvalid}
                        />
                        <div className="leading-none">
                          <FieldLabel htmlFor={`contact-${field.name}`}>
                            <span>
                              {t.rich("fields.gdprConsent.label", {
                                link: (chunks) => (
                                  <Link
                                    href={legalLinks.gdpr.href}
                                    className="underline hover:no-underline"
                                  >
                                    {chunks}
                                  </Link>
                                ),
                              })}
                            </span>
                          </FieldLabel>
                        </div>
                      </Field>
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </div>
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
