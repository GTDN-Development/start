"use client";

import { useForm } from "@tanstack/react-form";
import { useId } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
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
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { app } from "@/config/app";
import {
  createWorkspaceUrlFormSchema,
  workspaceSlugMaxLength,
} from "@/features/workspaces/workspace-schemas";
import type { WorkspaceSettingsWorkspace } from "@/features/workspaces/settings/workspace-settings-types";
import type { WorkspaceNavigationItem } from "@/features/workspaces/workspace-navigation-types";
import type { WorkspaceResponse } from "@/server/workspaces/workspace-types";

type WorkspaceUrlFormValues = {
  url: string;
};

export function WorkspaceUrlSettingsItem({
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
  const t = useTranslations("pages.workspace.general.url");
  const tCommon = useTranslations("pages.workspace.common");
  const urlToastId = useId();
  const isReadOnly = workspace.role === "member";

  const workspaceUrlSchema = createWorkspaceUrlFormSchema({
    required: t("validation.required"),
    max: t("validation.max", {
      max: String(workspaceSlugMaxLength),
    }),
  });

  const form = useForm({
    defaultValues: {
      url: workspace.slug,
    },
    validators: {
      onSubmit: workspaceUrlSchema,
    },
    onSubmit: async ({ value }: { value: WorkspaceUrlFormValues }) => {
      if (isReadOnly) {
        return;
      }

      const nextUrl = value.url.trim();

      const response = await onUpdateWorkspaceAction({
        slug: nextUrl,
      });

      if (!response.ok) {
        if (response.errorCode === "SLUG_NOT_AVAILABLE") {
          toast.error(t("status.slugTaken"), {
            id: urlToastId,
          });
          return;
        }

        toast.error(t("status.updateFailed"), {
          id: urlToastId,
        });
        return;
      }

      form.reset();
      form.setFieldValue("url", response.data.workspaceSlug);

      toast.success(t("status.updated"), {
        id: urlToastId,
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
                    <form.Field name="url">
                      {(field) => {
                        const isInvalid =
                          (field.state.meta.isTouched || submissionAttempts > 0) &&
                          !field.state.meta.isValid;

                        return (
                          <Field data-invalid={isInvalid} className="grid max-w-md gap-2">
                            <FieldLabel htmlFor={`workspace-general-url-${field.name}`}>
                              {t("field.label")}
                            </FieldLabel>
                            <InputGroup>
                              <InputGroupAddon>{app.site.domain}/w/</InputGroupAddon>
                              <InputGroupInput
                                id={`workspace-general-url-${field.name}`}
                                name={`workspace-general-url-${field.name}`}
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={(event) => field.handleChange(event.target.value)}
                                placeholder={t("field.placeholder")}
                                autoComplete="off"
                                disabled={isReadOnly}
                                aria-invalid={isInvalid}
                              />
                            </InputGroup>
                            <FieldDescription>
                              {t("field.description", {
                                workspaceUrl: workspace.slug,
                              })}
                            </FieldDescription>
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
                        max: String(workspaceSlugMaxLength),
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
