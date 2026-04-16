"use client";

import { useForm } from "@tanstack/react-form";
import { useId } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  SettingsItem,
  SettingsItemContent,
  SettingsItemContentBody,
  SettingsItemContentHeader,
  SettingsItemDescription,
  SettingsItemFooter,
  SettingsItemTitle,
} from "@/components/ui/settings-item";
import {
  createWorkspaceNameFormSchema,
  workspaceNameMaxLength,
} from "@/features/workspaces/workspace-schemas";
import type { WorkspaceSettingsWorkspace } from "@/features/workspaces/settings/workspace-settings-types";
import type { WorkspaceNavigationItem } from "@/features/workspaces/workspace-navigation-types";
import type { WorkspaceResponse } from "@/server/workspaces/workspace-types";

type WorkspaceNameFormValues = {
  name: string;
};

export function WorkspaceNameSettingsItem({
  workspace,
  onUpdateWorkspaceAction,
}: {
  workspace: WorkspaceSettingsWorkspace;
  onUpdateWorkspaceAction: (input: {
    name?: string;
    slug?: string;
    removeAvatar?: boolean;
    avatarFile?: File;
  }) => Promise<WorkspaceResponse<{ workspaceSlug: string; workspace: WorkspaceNavigationItem }>>;
}) {
  const t = useTranslations("pages.workspace.general.name");
  const tCommon = useTranslations("pages.workspace.common");
  const nameToastId = useId();
  const isReadOnly = workspace.role === "member";

  const workspaceNameSchema = createWorkspaceNameFormSchema({
    required: t("validation.required"),
    max: t("validation.max", {
      max: String(workspaceNameMaxLength),
    }),
  });

  const form = useForm({
    defaultValues: {
      name: workspace.name,
    },
    validators: {
      onSubmit: workspaceNameSchema,
    },
    onSubmit: async ({ value }: { value: WorkspaceNameFormValues }) => {
      if (isReadOnly) {
        return;
      }

      const nextName = value.name.trim();

      const response = await onUpdateWorkspaceAction({
        name: nextName,
      });

      if (!response.ok) {
        toast.error(t("status.updateFailed"), {
          id: nameToastId,
        });
        return;
      }

      form.reset();
      form.setFieldValue("name", response.data.workspace.name);

      toast.success(t("status.updated"), {
        id: nameToastId,
      });
    },
  });

  return (
    <SettingsItem disabled={isReadOnly}>
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
            <>
              <SettingsItemContent className="flex flex-col gap-6">
                <SettingsItemContentHeader>
                  <SettingsItemTitle>{t("title")}</SettingsItemTitle>
                  <SettingsItemDescription>{t("description")}</SettingsItemDescription>
                </SettingsItemContentHeader>

                <SettingsItemContentBody>
                  <div className="grid gap-4">
                    <form.Field name="name">
                      {(field) => {
                        const isInvalid =
                          (field.state.meta.isTouched || submissionAttempts > 0) &&
                          !field.state.meta.isValid;

                        return (
                          <Field data-invalid={isInvalid} className="grid max-w-md gap-2">
                            <FieldLabel htmlFor={`workspace-general-name-${field.name}`}>
                              {t("field.label")}
                            </FieldLabel>
                            <Input
                              id={`workspace-general-name-${field.name}`}
                              name={`workspace-general-name-${field.name}`}
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(event) => field.handleChange(event.target.value)}
                              placeholder={t("field.placeholder")}
                              autoComplete="organization"
                              disabled={isReadOnly}
                              aria-invalid={isInvalid}
                            />
                            <FieldDescription>{t("field.description")}</FieldDescription>
                            {isInvalid && <FieldError errors={field.state.meta.errors} />}
                          </Field>
                        );
                      }}
                    </form.Field>
                  </div>
                </SettingsItemContentBody>
              </SettingsItemContent>

              <SettingsItemFooter>
                <SettingsItemDescription>
                  {isReadOnly
                    ? tCommon("readOnlyHint")
                    : t("footerHint", {
                        max: String(workspaceNameMaxLength),
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
            </>
          )}
        </form.Subscribe>
      </form>
    </SettingsItem>
  );
}
