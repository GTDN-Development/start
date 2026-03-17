"use client";

import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { useState, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/components/ui/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircleIcon, AlertCircleIcon, PaperclipIcon, XIcon } from "lucide-react";
import { legalLinks } from "@/config/navigation";
import { submitSupportFormAction } from "@/features/marketing/actions/marketing-actions";
import { Field, FieldLabel, FieldDescription, FieldError, FieldGroup } from "@/components/ui/field";
import { Turnstile, type TurnstileRef } from "@/components/ui/turnstile";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type AttachmentValue = {
  filename: string;
  data: string; // base64
  mimeType: string;
};

type SupportFormValues = {
  message: string;
  attachment?: AttachmentValue | undefined;
  gdprConsent: boolean;
  turnstileToken: string;
};

export function SupportForm({ className, ...props }: React.ComponentProps<"div">) {
  const t = useTranslations("forms.support");
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });
  const turnstileRef = useRef<TurnstileRef>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const readFileAsBase64 = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }, []);

  const supportFormSchema = z.object({
    message: z
      .string()
      .min(10, { message: t("validation.messageMin") })
      .max(1000, { message: t("validation.messageMax") }),
    attachment: z.union([
      z.object({ filename: z.string(), data: z.string(), mimeType: z.string() }),
      z.undefined(),
    ]),
    gdprConsent: z.boolean().refine((v) => v === true, {
      message: t("validation.gdprConsent"),
    }),
    turnstileToken: z.string().min(1, { message: t("validation.turnstile") }),
  });

  const form = useForm({
    defaultValues: {
      message: "",
      attachment: undefined as AttachmentValue | undefined,
      gdprConsent: false,
      turnstileToken: "",
    },
    validators: { onSubmit: supportFormSchema },
    onSubmit: async ({ value }: { value: SupportFormValues }) => {
      setSubmitStatus({ type: null, message: "" });

      const response = await submitSupportFormAction(value);

      if (response.ok) {
        setSubmitStatus({ type: "success", message: t("status.success.message") });
        form.reset();
        turnstileRef.current?.reset();
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      setSubmitStatus({ type: "error", message: t("status.error.message") });
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
              <form.Field name="message">
                {(field) => {
                  const isInvalid =
                    (field.state.meta.isTouched || submissionAttempts > 0) &&
                    !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={`support-${field.name}`}>
                        {t("fields.message.label")}
                      </FieldLabel>
                      <Textarea
                        id={`support-${field.name}`}
                        name={`support-${field.name}`}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        placeholder={t("fields.message.placeholder")}
                        rows={5}
                      />
                      <FieldDescription>{t("fields.message.description")}</FieldDescription>
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  );
                }}
              </form.Field>

              <form.Field name="attachment">
                {(field) => (
                  <Field>
                    <FieldLabel>{t("fields.attachment.label")}</FieldLabel>
                    <input
                      ref={fileInputRef}
                      type="file"
                      id="support-attachment"
                      className="sr-only"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) {
                          field.handleChange(undefined);
                          return;
                        }
                        const data = await readFileAsBase64(file);
                        field.handleChange({ filename: file.name, data, mimeType: file.type });
                      }}
                    />
                    {field.state.value ? (
                      <div className="border-border flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
                        <PaperclipIcon
                          aria-hidden="true"
                          className="text-muted-foreground size-4 shrink-0"
                        />
                        <span className="flex-1 truncate">{field.state.value.filename}</span>
                        <button
                          type="button"
                          onClick={() => {
                            field.handleChange(undefined);
                            if (fileInputRef.current) fileInputRef.current.value = "";
                          }}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <XIcon aria-hidden="true" className="size-4" />
                        </button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <PaperclipIcon aria-hidden="true" />
                        {t("fields.attachment.button")}
                      </Button>
                    )}
                    <FieldDescription>{t("fields.attachment.description")}</FieldDescription>
                  </Field>
                )}
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
                          id={`support-${field.name}`}
                          name={`support-${field.name}`}
                          checked={field.state.value}
                          onCheckedChange={(checked) => field.handleChange(checked === true)}
                          aria-invalid={isInvalid}
                        />
                        <div className="leading-none">
                          <FieldLabel htmlFor={`support-${field.name}`}>
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
