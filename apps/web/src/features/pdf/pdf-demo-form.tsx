"use client";

import { useForm, type FormValidateOrFn, type ReactFormExtendedApi } from "@tanstack/react-form";
import { FileTextIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { z } from "zod";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import type { DemoReportData } from "@/server/pdf/templates/demo-report";

export type PdfDemoScope =
  | {
      type: "user";
      name: string;
    }
  | {
      type: "organization";
      name: string;
      organizationSlug: string;
    };

type PdfDemoItem = {
  id: string;
  name: string;
  price: string;
};

type PdfDemoFormValues = {
  documentTitle: string;
};

type PdfDemoFormApi = ReactFormExtendedApi<
  PdfDemoFormValues,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  FormValidateOrFn<PdfDemoFormValues>,
  undefined,
  undefined,
  undefined,
  undefined,
  never
>;

type PdfDemoFormProps = {
  scope: PdfDemoScope;
  appName: string;
  defaultDocumentTitle: string;
  defaultItems: PdfDemoItem[];
};

export function PdfDemoForm({
  scope,
  appName,
  defaultDocumentTitle,
  defaultItems,
}: PdfDemoFormProps) {
  const t = useTranslations("forms.pdfDemo");
  const logoInputId = useId();
  const [items, setItems] = useState(defaultItems);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [itemsError, setItemsError] = useState<string | null>(null);

  const schema = z.object({
    documentTitle: z.string().trim().min(2, t("validation.required")).max(120, t("validation.max")),
  });
  const form = useForm({
    defaultValues: {
      documentTitle: defaultDocumentTitle,
    },
    validators: {
      onSubmit: schema,
    },
    onSubmit: async ({ value }: { value: PdfDemoFormValues }) => {
      setSubmitError(null);

      const normalizedItems = normalizeItems(items);
      const nextLogoError = validateLogoFile(logoFile, t("validation.logoInvalid"));
      const nextItemsError = normalizedItems.length === 0 ? t("validation.itemsRequired") : null;

      setLogoError(nextLogoError);
      setItemsError(nextItemsError);

      if (nextLogoError || nextItemsError) {
        return;
      }

      const previewWindow = window.open("", "_blank");

      try {
        const logoSrc = logoFile ? await readBlobAsDataUrl(logoFile) : null;
        const response = await fetch("/api/pdf/demo", {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            scope: toPdfDemoRequestScope(scope),
            report: createReportData({
              documentTitle: value.documentTitle,
              items: normalizedItems,
              logoSrc,
              scope,
              labels: {
                logoAlt: t("report.logoAlt"),
                eyebrow: t(`report.eyebrow.${scope.type}`),
                footerNote: t("report.footerNote", {
                  appName,
                }),
              },
            }),
          }),
        });

        if (!response.ok) {
          throw new Error("PDF demo request failed.");
        }

        const pdfUrl = URL.createObjectURL(await response.blob());

        if (previewWindow) {
          previewWindow.opener = null;
          previewWindow.location.href = pdfUrl;
        } else {
          openPdfUrl(pdfUrl);
        }

        window.setTimeout(function revokePdfUrl() {
          URL.revokeObjectURL(pdfUrl);
        }, 60_000);
      } catch {
        previewWindow?.close();
        setSubmitError(t("status.error"));
      }
    },
  });
  const typedForm = form as unknown as PdfDemoFormApi;

  return (
    <div>
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
              <typedForm.Field name="documentTitle">
                {(field) => {
                  const isInvalid =
                    (field.state.meta.isTouched || submissionAttempts > 0) &&
                    !field.state.meta.isValid;

                  return (
                    <Field data-invalid={isInvalid} className="max-w-xl">
                      <FieldLabel htmlFor={`pdf-demo-${field.name}`}>
                        {t("fields.documentTitle.label")}
                      </FieldLabel>
                      <Input
                        id={`pdf-demo-${field.name}`}
                        name={`pdf-demo-${field.name}`}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) => field.handleChange(event.target.value)}
                        aria-invalid={isInvalid}
                        placeholder={t("fields.documentTitle.placeholder")}
                      />
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  );
                }}
              </typedForm.Field>

              <Field data-invalid={Boolean(logoError)} className="max-w-xl">
                <FieldLabel htmlFor={logoInputId}>{t("fields.logo.label")}</FieldLabel>
                <Input
                  id={logoInputId}
                  name="pdf-demo-logo"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  aria-invalid={Boolean(logoError)}
                  onChange={(event) => {
                    setLogoFile(event.target.files?.[0] ?? null);
                    setLogoError(null);
                  }}
                />
                {logoError && <FieldError>{logoError}</FieldError>}
              </Field>

              <FieldGroup className="gap-4">
                <FieldLabel>{t("fields.items.label")}</FieldLabel>

                <div className="grid gap-3">
                  {items.map((item, index) => (
                    <PdfDemoItemRow
                      key={item.id}
                      item={item}
                      index={index}
                      canRemove={items.length > 1}
                      labels={{
                        name: t("fields.itemName.label"),
                        namePlaceholder: t("fields.itemName.placeholder"),
                        price: t("fields.itemPrice.label"),
                        pricePlaceholder: t("fields.itemPrice.placeholder"),
                        remove: t("items.remove"),
                      }}
                      onChange={handleItemChange}
                      onRemove={handleRemoveItem}
                    />
                  ))}
                </div>

                {itemsError && <FieldError>{itemsError}</FieldError>}

                <div>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                    <PlusIcon aria-hidden="true" />
                    {t("items.add")}
                  </Button>
                </div>
              </FieldGroup>

              {submitError && (
                <Alert variant="destructive">
                  <AlertTitle>{t("status.errorTitle")}</AlertTitle>
                  <AlertDescription>{submitError}</AlertDescription>
                </Alert>
              )}

              <Separator />

              <div className="flex justify-stretch md:justify-end">
                <Button type="submit" disabled={isSubmitting} className="w-full md:w-fit">
                  {isSubmitting ? <Spinner /> : <FileTextIcon aria-hidden="true" />}
                  {isSubmitting ? t("submit.pending") : t("submit.default")}
                </Button>
              </div>
            </FieldGroup>
          )}
        </form.Subscribe>
      </form>
    </div>
  );

  function handleAddItem() {
    setItems((currentItems) => [...currentItems, createEmptyItem()]);
    setItemsError(null);
  }

  function handleRemoveItem(itemId: string) {
    setItems((currentItems) => currentItems.filter((item) => item.id !== itemId));
    setItemsError(null);
  }

  function handleItemChange(itemId: string, nextItem: Omit<PdfDemoItem, "id">) {
    setItems((currentItems) =>
      currentItems.map((item) => (item.id === itemId ? { ...item, ...nextItem } : item))
    );
    setItemsError(null);
  }
}

function PdfDemoItemRow({
  item,
  index,
  canRemove,
  labels,
  onChange,
  onRemove,
}: {
  item: PdfDemoItem;
  index: number;
  canRemove: boolean;
  labels: {
    name: string;
    namePlaceholder: string;
    price: string;
    pricePlaceholder: string;
    remove: string;
  };
  onChange: (itemId: string, nextItem: Omit<PdfDemoItem, "id">) => void;
  onRemove: (itemId: string) => void;
}) {
  const rowLabel = `${index + 1}. ${labels.name}`;

  return (
    <div className="grid gap-3 rounded-md border p-3 sm:grid-cols-[1fr_10rem_auto]">
      <Field>
        <FieldLabel htmlFor={`pdf-demo-item-name-${item.id}`}>{rowLabel}</FieldLabel>
        <Input
          id={`pdf-demo-item-name-${item.id}`}
          value={item.name}
          placeholder={labels.namePlaceholder}
          onChange={(event) =>
            onChange(item.id, {
              name: event.target.value,
              price: item.price,
            })
          }
        />
      </Field>
      <Field>
        <FieldLabel htmlFor={`pdf-demo-item-price-${item.id}`}>{labels.price}</FieldLabel>
        <Input
          id={`pdf-demo-item-price-${item.id}`}
          value={item.price}
          placeholder={labels.pricePlaceholder}
          onChange={(event) =>
            onChange(item.id, {
              name: item.name,
              price: event.target.value,
            })
          }
        />
      </Field>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="self-end"
        disabled={!canRemove}
        aria-label={labels.remove}
        onClick={() => onRemove(item.id)}
      >
        <Trash2Icon aria-hidden="true" />
      </Button>
    </div>
  );
}

function createReportData({
  documentTitle,
  items,
  labels,
  logoSrc,
  scope,
}: {
  documentTitle: string;
  items: Array<Omit<PdfDemoItem, "id">>;
  labels: {
    logoAlt: string;
    eyebrow: string;
    footerNote: string;
  };
  logoSrc: string | null;
  scope: PdfDemoScope;
}): DemoReportData {
  return {
    logo: logoSrc
      ? {
          alt: labels.logoAlt,
          src: logoSrc,
        }
      : null,
    eyebrow: labels.eyebrow,
    issuerName: scope.name,
    title: documentTitle,
    items: items.map((item) => ({
      label: item.name,
      value: item.price,
    })),
    footerNote: labels.footerNote,
  };
}

function normalizeItems(items: PdfDemoItem[]): Array<Omit<PdfDemoItem, "id">> {
  return items
    .map((item) => ({
      name: item.name.trim(),
      price: item.price.trim(),
    }))
    .filter((item) => item.name.length > 0 && item.price.length > 0);
}

function createEmptyItem(): PdfDemoItem {
  return {
    id: crypto.randomUUID(),
    name: "",
    price: "",
  };
}

function validateLogoFile(file: File | null, invalidMessage: string): string | null {
  if (!file) {
    return null;
  }

  if (!["image/png", "image/jpeg", "image/webp", "image/svg+xml"].includes(file.type)) {
    return invalidMessage;
  }

  return null;
}

function toPdfDemoRequestScope(scope: PdfDemoScope) {
  if (scope.type === "organization") {
    return {
      type: scope.type,
      organizationSlug: scope.organizationSlug,
    };
  }

  return {
    type: scope.type,
  };
}

function readBlobAsDataUrl(blob: Blob): Promise<string> {
  return new Promise(function resolveDataUrl(resolve, reject) {
    const reader = new FileReader();

    reader.addEventListener("load", function handleLoad() {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Unable to read PDF demo logo."));
    });
    reader.addEventListener("error", function handleError() {
      reject(reader.error ?? new Error("Unable to read PDF demo logo."));
    });
    reader.readAsDataURL(blob);
  });
}

function openPdfUrl(url: string) {
  const link = document.createElement("a");

  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.click();
}
