"use client";

import { type ChangeEvent, type FormEvent, useId, useState } from "react";
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
import type { WorkspaceSettingsWorkspace } from "@/features/workspaces/settings/workspace-settings-types";
import type { WorkspaceNavigationItem } from "@/features/workspaces/workspace-navigation-types";
import {
  createWorkspaceNameFormSchema,
  createWorkspaceSlugTextFormSchema,
  workspaceNameMaxLength,
  workspaceSlugMaxLength,
} from "@/features/workspaces/workspace-schemas";
import type { WorkspaceResponse } from "@/features/workspaces/workspace-types";

type WorkspaceTextSettingsItemProps = {
  workspace: WorkspaceSettingsWorkspace;
  field: "name" | "url";
  onUpdateWorkspaceAction: (input: {
    name?: string;
    slug?: string;
    removeAvatar?: boolean;
    avatarFile?: File;
  }) => Promise<WorkspaceResponse<{ workspaceSlug: string; workspace: WorkspaceNavigationItem }>>;
};

export function WorkspaceTextSettingsItem({
  workspace,
  field,
  onUpdateWorkspaceAction,
}: WorkspaceTextSettingsItemProps) {
  const t = useTranslations(`pages.workspace.general.${field}`);
  const tCommon = useTranslations("pages.workspace.common");
  const toastId = useId();
  const isReadOnly = workspace.role === "member";
  const maxLength = field === "name" ? workspaceNameMaxLength : workspaceSlugMaxLength;
  const initialValue = field === "name" ? workspace.name : workspace.slug;
  const formSchema =
    field === "name"
      ? createWorkspaceNameFormSchema({
          required: t("validation.required"),
          max: t("validation.max", {
            max: String(maxLength),
          }),
        })
      : createWorkspaceSlugTextFormSchema({
          required: t("validation.required"),
          max: t("validation.max", {
            max: String(maxLength),
          }),
        });

  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fieldId = `workspace-general-${field}-${field}`;
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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
    const response = await onUpdateWorkspaceAction(
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

    setValue(field === "name" ? response.data.workspace.name : response.data.workspaceSlug);
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
                  <InputGroupAddon>{app.site.domain}/w/</InputGroupAddon>
                  <InputGroupInput {...inputProps} autoComplete="off" />
                </InputGroup>
              ) : (
                <Input {...inputProps} autoComplete="organization" />
              )}
              <FieldDescription>
                {field === "url"
                  ? t("field.description", {
                      workspaceUrl: workspace.slug,
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
