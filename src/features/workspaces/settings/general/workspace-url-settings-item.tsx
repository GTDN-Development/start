"use client";

import { useForm } from "@tanstack/react-form";
import { startTransition, useId, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { z } from "zod";
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
import { getWorkspaceSettingsHref } from "@/config/routes";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { app } from "@/config/app";
import { workspaceConfig } from "@/config/workspace";
import { updateWorkspaceGeneralAction } from "@/features/workspaces/actions/workspace-actions";
import { useWorkspaceNavigation } from "@/features/workspaces/workspace-navigation-context";
import type { WorkspaceSettingsWorkspace } from "@/features/workspaces/settings/workspace-settings-types";
import { useRouter } from "@/i18n/navigation";
import { runAsyncTransition } from "@/lib/app-utils";

type WorkspaceUrlFormValues = {
  url: string;
};

export function WorkspaceUrlSettingsItem({ workspace }: { workspace: WorkspaceSettingsWorkspace }) {
  const t = useTranslations("pages.workspace.general.url");
  const tCommon = useTranslations("pages.workspace.common");
  const router = useRouter();
  const { patchWorkspace, workspaces } = useWorkspaceNavigation();
  const urlToastId = useId();
  const [workspaceUrl, setWorkspaceUrl] = useState(workspace.slug);

  const currentWorkspace = workspaces.find(
    (candidateWorkspace) => candidateWorkspace.id === workspace.id
  );
  const workspaceSnapshot = currentWorkspace ? { ...workspace, ...currentWorkspace } : workspace;
  const isReadOnly = workspaceSnapshot.role === "member";

  const workspaceUrlSchema = z.object({
    url: z
      .string()
      .trim()
      .min(1, {
        message: t("validation.required"),
      })
      .max(workspaceConfig.limits.slugMaxLength, {
        message: t("validation.max", {
          max: String(workspaceConfig.limits.slugMaxLength),
        }),
      }),
  });

  const form = useForm({
    defaultValues: {
      url: workspaceUrl,
    },
    validators: {
      onSubmit: workspaceUrlSchema,
    },
    onSubmit: async ({ value }: { value: WorkspaceUrlFormValues }) => {
      if (isReadOnly) {
        return;
      }

      const nextUrl = value.url.trim();

      const response = await runAsyncTransition(() =>
        updateWorkspaceGeneralAction(workspaceSnapshot.slug, {
          slug: nextUrl,
        })
      );

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

      startTransition(() => {
        setWorkspaceUrl(response.data.workspaceSlug);
        patchWorkspace(workspaceSnapshot.id, response.data.workspace);
        form.reset();
        form.setFieldValue("url", response.data.workspaceSlug);
      });

      toast.success(t("status.updated"), {
        id: urlToastId,
      });

      if (response.data.workspaceSlug !== workspaceSnapshot.slug) {
        startTransition(() => {
          router.replace(getWorkspaceSettingsHref(response.data.workspaceSlug));
        });
      }
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
                                workspaceUrl,
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
                        max: String(workspaceConfig.limits.slugMaxLength),
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
