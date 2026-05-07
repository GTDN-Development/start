"use client";

import { type ChangeEvent, type SubmitEvent, useId, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import {
  SettingsItem,
  SettingsItemContent,
  SettingsItemContentBody,
  SettingsItemContentHeader,
  SettingsItemDescription,
  SettingsItemFooter,
  SettingsItemTitle,
} from "@/components/ui/settings-item";
import { Spinner } from "@/components/ui/spinner";
import { app } from "@/config/app";
import type { OrganizationSettingsOrganization } from "@/features/organizations/settings/organization-settings-types";
import type { OrganizationNavigationItem } from "@/features/organizations/organization-navigation-types";
import {
  createOrganizationNameFormSchema,
  createOrganizationSlugTextFormSchema,
  organizationNameMaxLength,
  organizationSlugMaxLength,
} from "@/features/organizations/organization-schemas";
import type { OrganizationResponse } from "@/features/organizations/organization-types";

type OrganizationTextSettingsItemProps = {
  organization: OrganizationSettingsOrganization;
  field: "name" | "url";
  onUpdateOrganizationAction: (input: {
    name?: string;
    slug?: string;
    removeAvatar?: boolean;
    avatarFile?: File;
  }) => Promise<
    OrganizationResponse<{ organizationSlug: string; organization: OrganizationNavigationItem }>
  >;
};

export function OrganizationTextSettingsItem({
  organization,
  field,
  onUpdateOrganizationAction,
}: OrganizationTextSettingsItemProps) {
  const t = useTranslations(`pages.organization.general.${field}`);
  const tCommon = useTranslations("pages.organization.common");
  const toastId = useId();
  const isReadOnly = organization.role === "member";
  const maxLength = field === "name" ? organizationNameMaxLength : organizationSlugMaxLength;
  const initialValue = field === "name" ? organization.name : organization.slug;
  const formSchema =
    field === "name"
      ? createOrganizationNameFormSchema({
          required: t("validation.required"),
          max: t("validation.max", {
            max: String(maxLength),
          }),
        })
      : createOrganizationSlugTextFormSchema({
          required: t("validation.required"),
          max: t("validation.max", {
            max: String(maxLength),
          }),
        });

  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fieldId = `organization-general-${field}-${field}`;
  const inputProps = {
    id: fieldId,
    name: fieldId,
    value,
    onChange: handleValueChange,
    placeholder: t("field.placeholder"),
    disabled: isReadOnly,
    "aria-invalid": Boolean(error),
  };

  function handleValueChange(event: ChangeEvent<HTMLInputElement>) {
    setError(null);
    setValue(event.target.value);
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isReadOnly || isSubmitting) {
      return;
    }

    const nextValue = value.trim();
    const validationResult = formSchema.safeParse(
      field === "name" ? { name: nextValue } : { slug: nextValue }
    );

    if (!validationResult.success) {
      setError(validationResult.error.issues[0]?.message ?? t("validation.required"));
      return;
    }

    setIsSubmitting(true);
    const response = await onUpdateOrganizationAction(
      field === "name" ? { name: nextValue } : { slug: nextValue }
    );
    setIsSubmitting(false);

    if (!response.ok) {
      toast.error(
        response.errorCode === "SLUG_NOT_AVAILABLE" && field === "url"
          ? t("status.slugTaken")
          : t("status.updateFailed"),
        {
          id: toastId,
        }
      );
      return;
    }

    setValue(field === "name" ? response.data.organization.name : response.data.organizationSlug);
    setError(null);
    toast.success(t("status.updated"), {
      id: toastId,
    });
  }

  return (
    <SettingsItem disabled={isReadOnly}>
      <form onSubmit={handleSubmit}>
        <SettingsItemContent className="flex flex-col gap-6">
          <SettingsItemContentHeader>
            <SettingsItemTitle>{t("title")}</SettingsItemTitle>
            <SettingsItemDescription>{t("description")}</SettingsItemDescription>
          </SettingsItemContentHeader>

          <SettingsItemContentBody>
            <Field data-invalid={Boolean(error)} className="grid max-w-md gap-2">
              <FieldLabel htmlFor={fieldId}>{t("field.label")}</FieldLabel>
              {field === "url" ? (
                <InputGroup>
                  <InputGroupAddon>{app.site.domain}/o/</InputGroupAddon>
                  <InputGroupInput {...inputProps} autoComplete="off" />
                </InputGroup>
              ) : (
                <Input {...inputProps} autoComplete="organization" />
              )}
              <FieldDescription>
                {field === "url"
                  ? t("field.description", {
                      organizationUrl: organization.slug,
                    })
                  : t("field.description")}
              </FieldDescription>
              {error && <FieldError>{error}</FieldError>}
            </Field>
          </SettingsItemContentBody>
        </SettingsItemContent>

        <SettingsItemFooter>
          <SettingsItemDescription>
            {isReadOnly
              ? tCommon("readOnlyHint")
              : t("footerHint", {
                  max: String(maxLength),
                })}
          </SettingsItemDescription>
          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting || isReadOnly}
            className="sm:self-end"
          >
            {isSubmitting && <Spinner />}
            {isSubmitting ? t("submit.pending") : t("submit.default")}
          </Button>
        </SettingsItemFooter>
      </form>
    </SettingsItem>
  );
}
