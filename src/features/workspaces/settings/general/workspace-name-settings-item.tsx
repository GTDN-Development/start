"use client";

import { useForm } from "@tanstack/react-form";
import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { z } from "zod";
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
import { workspaceConfig } from "@/config/workspace";
import { updateWorkspaceGeneralAction } from "@/features/workspaces/actions/workspace-actions";
import { useWorkspaceNavigation } from "@/features/workspaces/workspace-navigation-context";
import type { WorkspaceSettingsWorkspace } from "@/features/workspaces/settings/workspace-settings-types";

type WorkspaceNameFormValues = {
  name: string;
};

export function WorkspaceNameSettingsItem({
  workspace,
}: {
  workspace: WorkspaceSettingsWorkspace;
}) {
  const t = useTranslations("pages.workspace.general.name");
  const tCommon = useTranslations("pages.workspace.common");
  const { patchWorkspace, workspaces } = useWorkspaceNavigation();
  const nameToastId = useId();
  const currentWorkspace = workspaces.find(
    (candidateWorkspace) => candidateWorkspace.id === workspace.id
  );
  const workspaceSnapshot = currentWorkspace ? { ...workspace, ...currentWorkspace } : workspace;
  const isReadOnly = workspaceSnapshot.role !== "owner";
  const [workspaceName, setWorkspaceName] = useState(workspace.name);
  const workspaceNameSchema = z.object({
    name: z
      .string()
      .trim()
      .min(1, {
        message: t("validation.required"),
      })
      .max(workspaceConfig.limits.nameMaxLength, {
        message: t("validation.max", {
          max: String(workspaceConfig.limits.nameMaxLength),
        }),
      }),
  });

  const form = useForm({
    defaultValues: {
      name: workspaceName,
    },
    validators: {
      onSubmit: workspaceNameSchema,
    },
    onSubmit: async ({ value }: { value: WorkspaceNameFormValues }) => {
      if (isReadOnly) {
        return;
      }

      const nextName = value.name.trim();

      const response = await updateWorkspaceGeneralAction(workspaceSnapshot.slug, {
        name: nextName,
      });

      if (!response.ok) {
        toast.error(t("status.updateFailed"), {
          id: nameToastId,
        });
        return;
      }

      setWorkspaceName(nextName);
      patchWorkspace(workspaceSnapshot.id, response.data.workspace);
      form.reset();
      form.setFieldValue("name", nextName);

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
                        max: String(workspaceConfig.limits.nameMaxLength),
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
