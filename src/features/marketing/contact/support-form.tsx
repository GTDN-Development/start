"use client";

import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { startTransition, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircleIcon, AlertCircleIcon, PaperclipIcon, XIcon } from "lucide-react";
import { submitSupportFormAction } from "@/features/marketing/contact/contact-actions";
import { Field, FieldLabel, FieldDescription, FieldError, FieldGroup } from "@/components/ui/field";
import {
  getSupportAttachmentsTotalSize,
  SUPPORT_ATTACHMENTS_MAX_TOTAL_SIZE_BYTES,
  type SupportAttachmentValue,
} from "@/features/marketing/contact/support-attachments";
import { Spinner } from "@/components/ui/spinner";
import { runAsyncTransition } from "@/lib/app-utils";
import { cn } from "@/lib/utils";

type SupportFormValues = {
  message: string;
  attachments: SupportAttachmentValue[];
};

export function SupportForm({ className, ...props }: React.ComponentProps<"div">) {
  const t = useTranslations("forms.support");

  const attachmentSchema = z.object({
    filename: z.string(),
    data: z.string(),
    mimeType: z.string(),
    size: z.number().nonnegative(),
  });

  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supportFormSchema = z.object({
    message: z
      .string()
      .min(10, { message: t("validation.messageMin") })
      .max(1000, { message: t("validation.messageMax") }),
    attachments: z
      .array(attachmentSchema)
      .refine(
        (attachments) =>
          getSupportAttachmentsTotalSize(attachments) <= SUPPORT_ATTACHMENTS_MAX_TOTAL_SIZE_BYTES,
        {
          message: t("validation.attachmentsMaxTotalSize"),
        }
      ),
  });
  const form = useForm({
    defaultValues: {
      message: "",
      attachments: [] as SupportAttachmentValue[],
    },
    validators: { onSubmit: supportFormSchema },
    onSubmit: async ({ value }: { value: SupportFormValues }) => {
      setSubmitStatus({ type: null, message: "" });
      setAttachmentError(null);

      const response = await runAsyncTransition(() => submitSupportFormAction(value));

      if (response.ok) {
        startTransition(() => {
          setSubmitStatus({ type: "success", message: t("status.success.message") });
          form.reset();
          setAttachmentError(null);
        });
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      setSubmitStatus({ type: "error", message: t("status.error.message") });
    },
  });

  return (
    <div {...props} className={cn("@container flex w-full flex-col gap-6", className)}>
      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-lg font-semibold tracking-tight">{t("intro.title")}</h2>
        <p className="text-muted-foreground text-sm">{t("intro.description")}</p>
      </div>

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
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  );
                }}
              </form.Field>

              <form.Field name="attachments">
                {(field) => {
                  const isInvalid =
                    attachmentError !== null ||
                    ((field.state.meta.isTouched || submissionAttempts > 0) &&
                      !field.state.meta.isValid);
                  const errors = attachmentError
                    ? [{ message: attachmentError }, ...(field.state.meta.errors ?? [])]
                    : field.state.meta.errors;

                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor="support-attachments">
                        {t("fields.attachment.label")}
                      </FieldLabel>
                      <input
                        ref={fileInputRef}
                        type="file"
                        id="support-attachments"
                        multiple
                        className="sr-only"
                        onChange={async (e) => {
                          const files = e.target.files;

                          if (!files?.length) {
                            return;
                          }

                          const nextFiles = Array.from(files);
                          const currentTotalSize = getSupportAttachmentsTotalSize(
                            field.state.value
                          );
                          const selectedFilesTotalSize = nextFiles.reduce(
                            (total, file) => total + file.size,
                            0
                          );

                          if (
                            currentTotalSize + selectedFilesTotalSize >
                            SUPPORT_ATTACHMENTS_MAX_TOTAL_SIZE_BYTES
                          ) {
                            setAttachmentError(t("validation.attachmentsMaxTotalSize"));
                            if (fileInputRef.current) {
                              fileInputRef.current.value = "";
                            }
                            return;
                          }

                          const nextAttachments = await Promise.all(
                            nextFiles.map(createSupportAttachmentValue)
                          );

                          setAttachmentError(null);
                          field.handleChange([...field.state.value, ...nextAttachments]);

                          if (fileInputRef.current) {
                            fileInputRef.current.value = "";
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <PaperclipIcon aria-hidden="true" />
                        {t("fields.attachment.button")}
                      </Button>
                      {field.state.value.length > 0 && (
                        <div className="flex flex-col gap-2">
                          {field.state.value.map((attachment, index) => (
                            <div
                              key={`${attachment.filename}-${index}`}
                              className="border-border flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
                            >
                              <PaperclipIcon
                                aria-hidden="true"
                                className="text-muted-foreground size-4 shrink-0"
                              />
                              <span className="flex-1 truncate">{attachment.filename}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setAttachmentError(null);
                                  field.handleChange(
                                    field.state.value.filter(
                                      (_attachment, attachmentIndex) => attachmentIndex !== index
                                    )
                                  );
                                  if (fileInputRef.current) {
                                    fileInputRef.current.value = "";
                                  }
                                }}
                                className="text-muted-foreground hover:text-foreground transition-colors"
                              >
                                <XIcon aria-hidden="true" className="size-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <FieldDescription>{t("fields.attachment.description")}</FieldDescription>
                      {isInvalid && <FieldError errors={errors} />}
                    </Field>
                  );
                }}
              </form.Field>

              <Button type="submit" disabled={isSubmitting} size="lg" className="w-full self-start">
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

function createSupportAttachmentValue(file: File): Promise<SupportAttachmentValue> {
  return readFileAsBase64(file).then((data) => ({
    filename: file.name,
    data,
    mimeType: file.type,
    size: file.size,
  }));
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
