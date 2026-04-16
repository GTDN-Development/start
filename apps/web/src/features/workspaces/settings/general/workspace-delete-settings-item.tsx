"use client";

import { useForm } from "@tanstack/react-form";
import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Trash2Icon } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  SettingsItem,
  SettingsItemContent,
  SettingsItemContentHeader,
  SettingsItemDescription,
  SettingsItemFooter,
  SettingsItemTitle,
} from "@/components/ui/settings-item";
import { Spinner } from "@/components/ui/spinner";
import { createWorkspaceDeleteFormSchema } from "@/features/workspaces/workspace-schemas";
import type { WorkspaceSettingsWorkspace } from "@/features/workspaces/settings/workspace-settings-types";
import type { WorkspaceResponse } from "@/server/workspaces/workspace-types";

type DeleteWorkspaceFormValues = {
  confirmationUrl: string;
  isDeletionAcknowledged: boolean;
};

export function WorkspaceDeleteSettingsItem({
  workspace,
  onDeleteWorkspaceAction,
}: {
  workspace: WorkspaceSettingsWorkspace;
  onDeleteWorkspaceAction: () => Promise<WorkspaceResponse<{ deleted: true }>>;
}) {
  const t = useTranslations("pages.workspace.general.delete");
  const tCommon = useTranslations("pages.workspace.common");
  const deleteWorkspaceToastId = useId();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const isReadOnly = workspace.role !== "owner";

  const deleteWorkspaceSchema = createWorkspaceDeleteFormSchema(workspace.slug, {
    confirmationRequired: t("validation.confirmationUrl.required"),
    confirmationMismatch: t("validation.confirmationUrl.mismatch", {
      workspaceSlug: workspace.slug,
    }),
    acknowledged: t("validation.acknowledged.required"),
  });

  const form = useForm({
    defaultValues: {
      confirmationUrl: "",
      isDeletionAcknowledged: false,
    },
    validators: {
      onSubmit: deleteWorkspaceSchema,
    },
    onSubmit: async (_: { value: DeleteWorkspaceFormValues }) => {
      if (isReadOnly) {
        return;
      }

      const response = await onDeleteWorkspaceAction();

      if (!response.ok) {
        toast.error(t("status.failed"), {
          id: deleteWorkspaceToastId,
        });
        return;
      }

      toast.success(t("status.success"), {
        id: deleteWorkspaceToastId,
      });

      setIsDeleteDialogOpen(false);
      form.reset();
    },
  });

  function handleDeleteDialogOpenChange(open: boolean) {
    setIsDeleteDialogOpen(open);

    if (open) {
      form.reset();
    }
  }

  return (
    <SettingsItem variant="destructive" disabled={isReadOnly}>
      <SettingsItemContent>
        <SettingsItemContentHeader>
          <SettingsItemTitle>{t("title")}</SettingsItemTitle>
          <SettingsItemDescription>
            {t("description", {
              workspaceName: workspace.name,
            })}
          </SettingsItemDescription>
        </SettingsItemContentHeader>
      </SettingsItemContent>

      <SettingsItemFooter>
        {isReadOnly && <SettingsItemDescription>{tCommon("readOnlyHint")}</SettingsItemDescription>}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={handleDeleteDialogOpenChange}>
          <AlertDialogTrigger
            nativeButton={true}
            render={
              <Button
                type="button"
                variant="destructive"
                size="lg"
                className="sm:ml-auto"
                disabled={isReadOnly}
              >
                {t("trigger")}
              </Button>
            }
          />
          <AlertDialogContent className="sm:max-w-lg">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                form.handleSubmit();
              }}
              className="contents"
            >
              <form.Subscribe
                selector={(state) => ({
                  isSubmitting: state.isSubmitting,
                  submissionAttempts: state.submissionAttempts,
                })}
              >
                {({ isSubmitting, submissionAttempts }) => (
                  <>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t("dialog.title")}</AlertDialogTitle>
                      <AlertDialogDescription>{t("dialog.description")}</AlertDialogDescription>
                    </AlertDialogHeader>

                    <FieldGroup className="mt-4 flex flex-col gap-6 pb-2">
                      <form.Field name="confirmationUrl">
                        {(field) => {
                          const isInvalid =
                            (field.state.meta.isTouched || submissionAttempts > 0) &&
                            !field.state.meta.isValid;

                          return (
                            <Field data-invalid={isInvalid}>
                              <FieldLabel htmlFor={`workspace-delete-${field.name}`}>
                                {t("dialog.fields.confirmationUrl.label")}
                              </FieldLabel>
                              <Input
                                id={`workspace-delete-${field.name}`}
                                name={`workspace-delete-${field.name}`}
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={(event) => field.handleChange(event.target.value)}
                                autoComplete="off"
                                placeholder={workspace.slug}
                                aria-invalid={isInvalid}
                              />
                              <FieldDescription>
                                {t("dialog.fields.confirmationUrl.description", {
                                  workspaceSlug: workspace.slug,
                                })}
                              </FieldDescription>
                              {isInvalid && <FieldError errors={field.state.meta.errors} />}
                            </Field>
                          );
                        }}
                      </form.Field>

                      <form.Field name="isDeletionAcknowledged">
                        {(field) => {
                          const isInvalid =
                            (field.state.meta.isTouched || submissionAttempts > 0) &&
                            !field.state.meta.isValid;

                          return (
                            <div className="flex flex-col gap-2">
                              <Field orientation="horizontal" data-invalid={isInvalid}>
                                <Checkbox
                                  id={`workspace-delete-${field.name}`}
                                  name={`workspace-delete-${field.name}`}
                                  checked={field.state.value}
                                  onBlur={field.handleBlur}
                                  onCheckedChange={(checked) =>
                                    field.handleChange(checked === true)
                                  }
                                  aria-invalid={isInvalid}
                                />
                                <FieldLabel htmlFor={`workspace-delete-${field.name}`}>
                                  {t("dialog.fields.acknowledged.label")}
                                </FieldLabel>
                              </Field>
                              {isInvalid && <FieldError errors={field.state.meta.errors} />}
                            </div>
                          );
                        }}
                      </form.Field>
                    </FieldGroup>

                    <AlertDialogFooter>
                      <AlertDialogCancel type="button" size="lg" disabled={isSubmitting}>
                        {tCommon("cancel")}
                      </AlertDialogCancel>
                      <AlertDialogAction
                        type="submit"
                        size="lg"
                        variant="destructive"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <Spinner />
                        ) : (
                          <Trash2Icon aria-hidden="true" className="size-4" />
                        )}
                        {isSubmitting ? t("dialog.submit.pending") : t("dialog.submit.default")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </>
                )}
              </form.Subscribe>
            </form>
          </AlertDialogContent>
        </AlertDialog>
      </SettingsItemFooter>
    </SettingsItem>
  );
}
